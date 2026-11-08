"use client";

import { useMemo, useState } from "react";
import { DemoDialog } from "@/components/patient-select/dialog";
import {
  CONSULT_PACKAGES,
  alarmsForCohort,
  consultCohortFromAge,
  consultationRequestSchema,
  hasCriticalAlarms,
  reasonsForCohort,
  type ConsultAlarmId,
  type ConsultPackageId,
  type ConsultReasonId,
  type ConsultationRequestInput,
} from "@/lib/consultations/request-form";
import { cn } from "@/lib/utils";

export function RequestConsultationDialog({
  open,
  patientName,
  ageYears,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  patientName: string;
  ageYears: number;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: ConsultationRequestInput) => void;
}) {
  const cohort = consultCohortFromAge(ageYears);
  const reasons = reasonsForCohort(cohort);
  const alarms = alarmsForCohort(cohort);

  const [reasonId, setReasonId] = useState<ConsultReasonId | null>(null);
  const [alarmIds, setAlarmIds] = useState<ConsultAlarmId[]>([]);
  const [description, setDescription] = useState("");
  const [sinceLabel, setSinceLabel] = useState("");
  const [packageId, setPackageId] = useState<ConsultPackageId | null>(null);
  const [attempted, setAttempted] = useState(false);

  const parsed = useMemo(() => {
    return consultationRequestSchema.safeParse({
      cohort,
      reasonId,
      alarmIds,
      description,
      sinceLabel: sinceLabel.trim() || undefined,
      packageId,
    });
  }, [cohort, reasonId, alarmIds, description, sinceLabel, packageId]);

  const showCritical = hasCriticalAlarms(alarmIds);

  function resetAndClose() {
    setReasonId(null);
    setAlarmIds([]);
    setDescription("");
    setSinceLabel("");
    setPackageId(null);
    setAttempted(false);
    onClose();
  }

  function toggleAlarm(id: ConsultAlarmId) {
    setAlarmIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleSubmit() {
    setAttempted(true);
    if (!parsed.success || busy) {
      return;
    }
    onSubmit(parsed.data);
  }

  const cohortHint =
    cohort === "child"
      ? "Formular pentru copil"
      : cohort === "elder"
        ? "Formular pentru vârstnic"
        : "Formular pentru adult";

  return (
    <DemoDialog
      open={open}
      title="Solicită consultație"
      description={`Spune-ne pe scurt cum e ${patientName}, apoi alege pachetul.`}
      onClose={resetAndClose}
      size="lg"
    >
      <div className="space-y-5">
        <p className="text-xs font-medium text-muted-foreground">{cohortHint}</p>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold tracking-tight">
            Motivul principal
          </h3>
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason) => {
              const selected = reasonId === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setReasonId(reason.id)}
                  className={cn(
                    "min-h-10 rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {reason.label}
                </button>
              );
            })}
          </div>
          {attempted && reasonId == null ? (
            <p className="text-xs text-destructive">Alege un motiv.</p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold tracking-tight">
            Semne de alarmă
          </h3>
          <ul className="space-y-2">
            {alarms.map((alarm) => {
              const checked = alarmIds.includes(alarm.id);
              return (
                <li key={alarm.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-sm hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAlarm(alarm.id)}
                      className="mt-1 size-4 accent-foreground"
                    />
                    <span>{alarm.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {showCritical ? (
            <p
              className="rounded-xl border border-status-wait/40 bg-status-wait-soft px-3 py-2 text-xs leading-relaxed text-status-wait-foreground"
              role="status"
            >
              Ai bifat semne care pot necesita îngrijire urgentă. Dacă starea e
              gravă, sună 112 sau mergi la camera de gardă — consultația online
              nu înlocuiește urgența.
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <label
            htmlFor="consult-description"
            className="text-sm font-semibold tracking-tight"
          >
            Cum e {patientName} acum?
          </label>
          <textarea
            id="consult-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Ce s-a schimbat, de când, ce ați încercat…"
            className="w-full resize-none rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Minim 10 caractere.
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {description.length}/500
            </p>
          </div>
          {attempted && description.trim().length < 10 ? (
            <p className="text-xs text-destructive">
              Scrie o scurtă descriere.
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <label
            htmlFor="consult-since"
            className="text-sm font-semibold tracking-tight"
          >
            De când?{" "}
            <span className="font-normal text-muted-foreground">(opțional)</span>
          </label>
          <input
            id="consult-since"
            value={sinceLabel}
            onChange={(event) => setSinceLabel(event.target.value)}
            maxLength={80}
            placeholder="ex. de aseară, de 6 ore"
            className="w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </section>

        <section className="space-y-2 border-t border-border/60 pt-4">
          <h3 className="text-sm font-semibold tracking-tight">
            Alege pachetul
          </h3>
          <ul className="space-y-2">
            {CONSULT_PACKAGES.map((pack) => {
              const selected = packageId === pack.id;
              return (
                <li key={pack.id}>
                  <button
                    type="button"
                    onClick={() => setPackageId(pack.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-foreground bg-muted/60"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {pack.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {pack.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {pack.priceLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {attempted && packageId == null ? (
            <p className="text-xs text-destructive">Alege un pachet.</p>
          ) : null}
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Se trimite…" : "Trimite solicitarea"}
          </button>
        </div>
      </div>
    </DemoDialog>
  );
}
