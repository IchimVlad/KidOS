"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MealForm } from "@/components/nutrition/meal-form";
import {
  EmptyNote,
  FilterChips,
  MetaLine,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  TextButton,
} from "@/components/patient-dashboard/ui";
import { DemoDialog, DialogActions } from "@/components/patient-select/dialog";
import { addDays, lastDays, localDateKey } from "@/lib/nutrition/dates";
import {
  FOOD_GROUP_LABEL,
  MEAL_ORDER,
  MEAL_TYPE_LABEL,
  formatDayChip,
  formatShortDate,
} from "@/lib/nutrition/labels";
import { recommendationFor } from "@/lib/nutrition/recommendations";
import { buildDailySummary, buildNutritionSummary, REACTION_WINDOW_DAYS } from "@/lib/nutrition/summary";
import {
  MAX_HYDRATION_ML,
  type CreateNutritionEntry,
  type FoodGroup,
  type HydrationDay,
  type MealType,
  type NutritionEntry,
  type NutritionMeasurement,
  type NutritionPageData,
} from "@/lib/nutrition/types";
import { sexDotClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

const WATER_STEP_ML = 250;
const DAYS_SHOWN = 7;
const ADD_MEAL_FORM_ID = "nutrition-add-meal";

const noopSubscribe = () => () => {};

/** Ziua locală a dispozitivului; pe server (și la hidratare) folosește ziua serverului. */
function useLocalToday(serverToday: string): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => localDateKey(new Date()),
    () => serverToday,
  );
}

function defaultMealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

function hydrationMap(days: HydrationDay[]): Record<string, number> {
  return Object.fromEntries(days.map((day) => [day.date, day.amountMl]));
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  } catch {
    // Răspuns fără corp JSON.
  }
  return fallback;
}

export function NutritionPage({ data }: { data: NutritionPageData }) {
  const router = useRouter();
  const { person } = data;
  const today = useLocalToday(data.serverToday);
  const days = useMemo(() => lastDays(today, DAYS_SHOWN), [today]);

  const [baseline, setBaseline] = useState(data);
  const [entries, setEntries] = useState<NutritionEntry[]>(data.entries);
  const [hydration, setHydration] = useState<Record<string, number>>(() => hydrationMap(data.hydration));
  if (data !== baseline) {
    setBaseline(data);
    setEntries(data.entries);
    setHydration(hydrationMap(data.hydration));
  }

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const day = selectedDay != null && days.includes(selectedDay) ? selectedDay : today;

  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addFormKey, setAddFormKey] = useState(0);
  const [addMealType, setAddMealType] = useState<MealType>("breakfast");
  const [pendingDelete, setPendingDelete] = useState<NutritionEntry | null>(null);
  const hydrationRequest = useRef(0);

  const recommendation = recommendationFor(person.relation);
  const hydrationDays = useMemo(
    () => Object.entries(hydration).map(([date, amountMl]) => ({ date, amountMl })),
    [hydration],
  );
  const daily = buildDailySummary(day, entries, hydrationDays, person.relation);
  const summary = useMemo(
    () => buildNutritionSummary(entries, person.allergies, { today, relation: person.relation }),
    [entries, person.allergies, person.relation, today],
  );

  const dayEntries = entries.filter((entry) => entry.date === day);
  const dashboardHref = `/pacient/${person.id}`;
  const dayLabel = formatDayChip(day, today, addDays(today, -1));

  function openAddMeal() {
    setAddMealType(day === today ? defaultMealTypeForNow() : "lunch");
    setAddFormKey((key) => key + 1);
    setAddOpen(true);
  }

  async function addMeal(input: CreateNutritionEntry) {
    setAddOpen(false);
    setError(null);
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: NutritionEntry = { ...input, id: tempId, createdAt: new Date().toISOString() };
    setEntries((current) => [...current, optimistic]);

    try {
      const response = await fetch(`/api/pacient/${person.id}/nutrition/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Masa nu a putut fi salvată."));
      }
      const payload = (await response.json()) as { entry: NutritionEntry };
      setEntries((current) => current.map((entry) => (entry.id === tempId ? payload.entry : entry)));
      router.refresh();
    } catch (cause) {
      setEntries((current) => current.filter((entry) => entry.id !== tempId));
      setError(cause instanceof Error && cause.message ? cause.message : "Masa nu a putut fi salvată.");
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (target == null) {
      return;
    }
    setPendingDelete(null);
    setError(null);
    const previous = entries;
    setEntries((current) => current.filter((entry) => entry.id !== target.id));

    try {
      const response = await fetch(`/api/nutrition/entries/${target.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await readError(response, "Masa nu a putut fi ștearsă."));
      }
      router.refresh();
    } catch (cause) {
      setEntries(previous);
      setError(cause instanceof Error && cause.message ? cause.message : "Masa nu a putut fi ștearsă.");
    }
  }

  async function changeWater(delta: number) {
    const date = day;
    const previous = hydration[date] ?? 0;
    const next = Math.min(MAX_HYDRATION_ML, Math.max(0, previous + delta));
    if (next === previous) {
      return;
    }
    setError(null);
    setHydration((current) => ({ ...current, [date]: next }));
    const requestId = ++hydrationRequest.current;

    try {
      const response = await fetch(`/api/pacient/${person.id}/nutrition/hydration`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, amountMl: next }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Cantitatea de apă nu a putut fi salvată."));
      }
      if (requestId === hydrationRequest.current) {
        router.refresh();
      }
    } catch (cause) {
      // Revenim doar dacă între timp nu a pornit o altă modificare.
      if (requestId === hydrationRequest.current) {
        setHydration((current) => ({ ...current, [date]: previous }));
      }
      setError(
        cause instanceof Error && cause.message ? cause.message : "Cantitatea de apă nu a putut fi salvată.",
      );
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 px-6 pt-8 sm:px-10 sm:pt-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src="/kidos-logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7"
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Kidos
          </span>
        </Link>
        <Link
          href={dashboardHref}
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className={sexDotClass(person.sex)} aria-hidden="true" />
          <span className="truncate">Înapoi la {person.firstName}</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nutriție · {person.firstName}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Informații orientative, nu înlocuiesc sfatul medicului.
            </p>
          </div>
          <PrimaryButton onClick={openAddMeal}>Adaugă masă</PrimaryButton>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <TextButton onClick={() => setError(null)} className="shrink-0">
              Închide
            </TextButton>
          </div>
        ) : null}

        {person.allergies || person.chronicConditions ? (
          <section
            aria-label="Alergii și afecțiuni din profil"
            className="rounded-2xl border border-foreground/15 bg-muted/50 px-4 py-3 text-sm sm:px-5"
          >
            {person.allergies ? (
              <p>
                <span className="font-medium">Alergii: </span>
                {person.allergies}
              </p>
            ) : null}
            {person.chronicConditions ? (
              <p className={cn(person.allergies && "mt-1")}>
                <span className="font-medium">Afecțiuni: </span>
                {person.chronicConditions}
              </p>
            ) : null}
          </section>
        ) : null}

        <FilterChips
          label="Alege ziua"
          options={days.map((date) => ({ id: date, label: formatDayChip(date, today, days[1] ?? "") }))}
          value={day}
          onChange={setSelectedDay}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard title={`Rezumatul zilei · ${dayLabel}`} emphasized>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Grupe alimentare</p>
                  {daily.coveredGroups.length === 0 && daily.missingGroups.length === 0 ? (
                    <EmptyNote>Nicio grupă înregistrată.</EmptyNote>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {daily.coveredGroups.map((group) => (
                        <GroupChip key={group} group={group} covered />
                      ))}
                      {daily.missingGroups.map((group) => (
                        <GroupChip key={group} group={group} covered={false} />
                      ))}
                    </div>
                  )}
                  <MetaLine>
                    {daily.missingGroups.length === 0
                      ? "Toate grupele recomandate zilnic apar în jurnal."
                      : "Grupele punctate nu apar încă în jurnalul zilei."}
                  </MetaLine>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">Apă</p>
                    <p className="text-sm tabular-nums">
                      <span className="font-semibold">{daily.waterMl}</span>
                      <span className="text-muted-foreground"> / {daily.waterTargetMl} ml</span>
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Apă consumată față de ținta orientativă"
                    aria-valuemin={0}
                    aria-valuemax={daily.waterTargetMl}
                    aria-valuenow={Math.min(daily.waterMl, daily.waterTargetMl)}
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-200",
                        person.sex === "female" ? "bg-sex-female" : "bg-sex-male",
                      )}
                      style={{ width: `${Math.round(daily.waterProgress * 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <SecondaryButton onClick={() => changeWater(-WATER_STEP_ML)}>−250 ml</SecondaryButton>
                    <SecondaryButton onClick={() => changeWater(WATER_STEP_ML)}>+250 ml</SecondaryButton>
                  </div>
                  <MetaLine>Ținta este orientativă pentru categoria „{recommendation.label}”.</MetaLine>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Jurnal de mese"
              action={<TextButton onClick={openAddMeal}>Adaugă</TextButton>}
            >
              {dayEntries.length === 0 ? (
                <EmptyNote>Nicio masă înregistrată pentru {dayLabel.toLowerCase()}.</EmptyNote>
              ) : (
                <div className="space-y-5">
                  {MEAL_ORDER.map((mealType) => {
                    const meals = dayEntries.filter((entry) => entry.mealType === mealType);
                    if (meals.length === 0) {
                      return null;
                    }
                    return (
                      <div key={mealType} className="space-y-2">
                        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          {MEAL_TYPE_LABEL[mealType]}
                        </h3>
                        <ul className="space-y-2">
                          {meals.map((entry) => (
                            <MealItem key={entry.id} entry={entry} onDelete={() => setPendingDelete(entry)} />
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard title="Reacții recente">
              {summary.reactions.length === 0 ? (
                <EmptyNote>Nicio reacție raportată în ultimele {REACTION_WINDOW_DAYS} de zile.</EmptyNote>
              ) : (
                <ul className="space-y-3 text-sm">
                  {summary.reactions.map((reaction) => (
                    <li key={reaction.entryId} className="space-y-0.5">
                      <p className="font-medium">{reaction.description}</p>
                      {reaction.reactionNotes ? <p>{reaction.reactionNotes}</p> : null}
                      <MetaLine>
                        {formatShortDate(reaction.date)} · {MEAL_TYPE_LABEL[reaction.mealType]}
                      </MetaLine>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title={`Recomandări generale · ${recommendation.label}`}>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">Apă pe zi, orientativ: </span>
                  aproximativ {(recommendation.waterTargetMl / 1000).toLocaleString("ro-RO")} litri
                </p>
                <p>
                  <span className="font-medium">De inclus zilnic: </span>
                  {recommendation.dailyGroups.map((group) => FOOD_GROUP_LABEL[group].toLowerCase()).join(", ")}
                </p>
                <ul className="space-y-2">
                  {recommendation.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 leading-relaxed text-muted-foreground">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/50" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>

            <SectionCard title="Măsurători">
              <MeasurementsBlock
                relation={person.relation}
                weight={data.measurements.weight}
                height={data.measurements.height}
              />
            </SectionCard>
          </div>
        </div>
      </main>

      <DemoDialog
        open={addOpen}
        title="Adaugă masă"
        description={`Pentru ${dayLabel === "Azi" || dayLabel === "Ieri" ? dayLabel.toLowerCase() : formatShortDate(day)}.`}
        onClose={() => setAddOpen(false)}
        size="md"
      >
        <MealForm key={addFormKey} formId={ADD_MEAL_FORM_ID} date={day} initialMealType={addMealType} onSubmit={addMeal} />
        <DialogActions onCancel={() => setAddOpen(false)} confirmLabel="Salvează" formId={ADD_MEAL_FORM_ID} />
      </DemoDialog>

      <DemoDialog
        open={pendingDelete != null}
        title="Ștergi masa?"
        description={pendingDelete ? `„${pendingDelete.description}” va fi ștearsă din jurnal.` : undefined}
        onClose={() => setPendingDelete(null)}
      >
        <DialogActions onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} confirmLabel="Șterge" />
      </DemoDialog>
    </div>
  );
}

function GroupChip({ group, covered }: { group: FoodGroup; covered: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        covered ? "bg-foreground text-background" : "border border-dashed border-foreground/30 text-muted-foreground",
      )}
    >
      {covered ? null : <span className="sr-only">Lipsă: </span>}
      {FOOD_GROUP_LABEL[group]}
    </span>
  );
}

function MealItem({ entry, onDelete }: { entry: NutritionEntry; onDelete: () => void }) {
  const saving = entry.id.startsWith("temp-");
  return (
    <li className={cn("rounded-xl border border-border p-3 sm:p-4", saving && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium break-words">{entry.description}</p>
          {entry.foodGroups.length > 0 || entry.hadReaction ? (
            <div className="flex flex-wrap gap-1.5">
              {entry.hadReaction ? (
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                  Reacție
                </span>
              ) : null}
              {entry.foodGroups.map((group) => (
                <span key={group} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {FOOD_GROUP_LABEL[group]}
                </span>
              ))}
            </div>
          ) : null}
          {entry.hadReaction && entry.reactionNotes ? (
            <p className="text-sm text-destructive">{entry.reactionNotes}</p>
          ) : null}
          {entry.notes ? <MetaLine>{entry.notes}</MetaLine> : null}
        </div>
        {saving ? (
          <MetaLine>Se salvează…</MetaLine>
        ) : (
          <TextButton onClick={onDelete} className="shrink-0">
            Șterge
          </TextButton>
        )}
      </div>
    </li>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("ro-RO", { maximumFractionDigits: 1 });
}

function heightInMeters(height: NutritionMeasurement): number | null {
  if (height.numericValue == null) return null;
  const unit = height.unit?.trim().toLowerCase();
  if (unit === "cm") return height.numericValue / 100;
  if (unit === "m") return height.numericValue;
  return null;
}

function MeasurementsBlock({
  relation,
  weight,
  height,
}: {
  relation: NutritionPageData["person"]["relation"];
  weight: NutritionMeasurement | null;
  height: NutritionMeasurement | null;
}) {
  const isChild = relation === "child";
  const meters = height ? heightInMeters(height) : null;
  const kg =
    weight?.numericValue != null && weight.unit?.trim().toLowerCase() === "kg" ? weight.numericValue : null;
  const bmi = !isChild && kg != null && meters != null ? kg / (meters * meters) : null;

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-2 gap-3">
        <MeasurementValue label="Greutate" measurement={weight} />
        <MeasurementValue label="Înălțime" measurement={height} />
      </dl>
      {isChild ? (
        <MetaLine>Evaluarea creșterii pe percentile va fi disponibilă ulterior.</MetaLine>
      ) : bmi != null ? (
        <p>
          <span className="font-medium">IMC (orientativ): </span>
          {formatNumber(bmi)}
        </p>
      ) : (
        <MetaLine>IMC-ul se calculează când există greutatea (kg) și înălțimea.</MetaLine>
      )}
    </div>
  );
}

function MeasurementValue({ label, measurement }: { label: string; measurement: NutritionMeasurement | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">
        {measurement ? `${measurement.value}${measurement.unit ? ` ${measurement.unit}` : ""}` : "Nespecificat"}
      </dd>
      {measurement ? <MetaLine>{formatShortDate(measurement.recordedAt)}</MetaLine> : null}
    </div>
  );
}
