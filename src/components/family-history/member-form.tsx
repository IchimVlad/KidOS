"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CONDITION_CATEGORIES, conditionLabel, searchConditions } from "@/lib/family-history/conditions";
import {
  FAMILY_RELATIONS,
  RELATION_LABEL,
  familyMemberInputSchema,
  type FamilyCondition,
  type FamilyMember,
  type FamilyMemberInput,
  type FamilyRelation,
} from "@/lib/family-history/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring";

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.round(parsed) : Number.NaN;
}

/** Formularul unui membru al familiei: date de bază, stare și afecțiuni. */
export function MemberForm({
  formId,
  initial,
  relation: fixedRelation,
  allowedRelations,
  onSubmit,
}: {
  formId: string;
  initial: FamilyMember | null;
  /** Relația este fixă când se completează un loc din arbore (ex. „Mamă”). */
  relation: FamilyRelation | null;
  allowedRelations: FamilyRelation[];
  onSubmit: (input: FamilyMemberInput) => Promise<void>;
}) {
  const [relation, setRelation] = useState<FamilyRelation>(
    initial?.relation ?? fixedRelation ?? allowedRelations[0] ?? "brother",
  );
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [birthYear, setBirthYear] = useState(initial?.birthYear?.toString() ?? "");
  const [vitalStatus, setVitalStatus] = useState(initial?.vitalStatus ?? "alive");
  const [ageAtDeath, setAgeAtDeath] = useState(initial?.ageAtDeath?.toString() ?? "");
  const [causeOfDeath, setCauseOfDeath] = useState(initial?.causeOfDeath ?? "");
  const [conditionsStatus, setConditionsStatus] = useState(initial?.conditionsStatus ?? "unknown");
  const [conditions, setConditions] = useState<FamilyCondition[]>(initial?.conditions ?? []);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = familyMemberInputSchema.safeParse({
      relation,
      displayName: displayName.trim() || null,
      birthYear: toNumberOrNull(birthYear),
      vitalStatus,
      ageAtDeath: vitalStatus === "deceased" ? toNumberOrNull(ageAtDeath) : null,
      causeOfDeath: vitalStatus === "deceased" ? causeOfDeath.trim() || null : null,
      conditionsStatus,
      conditions: conditionsStatus === "known" ? conditions : [],
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = String(issue?.path[0] ?? "");
      setError(
        field === "birthYear"
          ? "Anul nașterii trebuie să fie între 1900 și anul curent."
          : field === "ageAtDeath"
            ? "Vârsta la deces trebuie să fie un număr între 0 și 120."
            : field === "conditions" && issue?.code === "custom"
              ? issue.message
              : field === "conditions"
                ? "Verificați vârstele la debut (0–120 de ani)."
                : (issue?.message ?? "Verificați câmpurile."),
      );
      return;
    }
    setError(null);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvarea a eșuat.");
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Relația cu copilul">
          {(id) =>
            fixedRelation || initial ? (
              <p id={id} className="py-2 font-medium">
                {RELATION_LABEL[relation]}
              </p>
            ) : (
              <select id={id} value={relation} onChange={(e) => setRelation(e.target.value as FamilyRelation)} className={inputClass}>
                {FAMILY_RELATIONS.filter((r) => allowedRelations.includes(r)).map((r) => (
                  <option key={r} value={r}>
                    {RELATION_LABEL[r]}
                  </option>
                ))}
              </select>
            )
          }
        </Field>
        <Field label="Prenume (opțional)">
          {(id) => (
            <input id={id} value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
          )}
        </Field>
        <Field label="Anul nașterii (opțional)">
          {(id) => (
            <input id={id} inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="ex. 1965" className={inputClass} />
          )}
        </Field>
        <fieldset>
          <legend className="mb-1.5 font-medium">Stare</legend>
          <ChoiceGroup
            name="vital"
            value={vitalStatus}
            onChange={setVitalStatus}
            options={[
              { value: "alive", label: "În viață" },
              { value: "deceased", label: "Decedat(ă)" },
            ]}
          />
        </fieldset>
      </div>

      {vitalStatus === "deceased" ? (
        <div className="grid gap-4 rounded-xl bg-muted/50 p-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Vârsta la deces">
            {(id) => (
              <input id={id} inputMode="numeric" value={ageAtDeath} onChange={(e) => setAgeAtDeath(e.target.value)} className={inputClass} />
            )}
          </Field>
          <Field label="Cauza (opțional)">
            {(id) => (
              <input id={id} value={causeOfDeath} maxLength={200} onChange={(e) => setCauseOfDeath(e.target.value)} className={inputClass} />
            )}
          </Field>
        </div>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="mb-1.5 font-medium">Afecțiuni</legend>
        <ChoiceGroup
          name="conditions-status"
          value={conditionsStatus}
          onChange={setConditionsStatus}
          options={[
            { value: "known", label: "Are afecțiuni" },
            { value: "none", label: "Nu există afecțiuni cunoscute" },
            { value: "unknown", label: "Nu știu" },
          ]}
        />
        {conditionsStatus === "known" ? (
          <ConditionsEditor conditions={conditions} onChange={setConditions} />
        ) : null}
      </fieldset>

      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function ChoiceGroup<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
            value === option.value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/** Lista de afecțiuni selectate + selectorul cu căutare, grupat pe categorii. */
function ConditionsEditor({
  conditions,
  onChange,
}: {
  conditions: FamilyCondition[];
  onChange: (conditions: FamilyCondition[]) => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const results = searchConditions(query);
  const selectedCodes = new Set(conditions.map((c) => c.code));

  function add(code: string) {
    // „Altele” poate apărea de mai multe ori (descrieri diferite); restul o singură dată.
    if (code !== "other" && selectedCodes.has(code)) return;
    onChange([...conditions, { code, customLabel: null, onsetAge: null, note: null }]);
    setQuery("");
  }

  function update(index: number, patch: Partial<FamilyCondition>) {
    onChange(conditions.map((condition, i) => (i === index ? { ...condition, ...patch } : condition)));
  }

  return (
    <div className="space-y-3">
      {conditions.length > 0 ? (
        <ul className="space-y-3">
          {conditions.map((condition, index) => (
            <li key={`${condition.code}-${index}`} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{conditionLabel(condition.code)}</p>
                <button
                  type="button"
                  onClick={() => onChange(conditions.filter((_, i) => i !== index))}
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Elimină
                </button>
              </div>
              {condition.code === "other" ? (
                <input
                  aria-label="Descrierea afecțiunii"
                  placeholder="Descrieți afecțiunea"
                  value={condition.customLabel ?? ""}
                  maxLength={80}
                  onChange={(e) => update(index, { customLabel: e.target.value || null })}
                  className={inputClass}
                />
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
                <input
                  aria-label={`Vârsta la debut – ${conditionLabel(condition.code)}`}
                  placeholder="Vârsta la debut"
                  inputMode="numeric"
                  value={condition.onsetAge?.toString() ?? ""}
                  onChange={(e) => update(index, { onsetAge: toNumberOrNull(e.target.value) })}
                  className={inputClass}
                />
                <input
                  aria-label={`Notă – ${conditionLabel(condition.code)}`}
                  placeholder={condition.code === "cancer" ? "Tipul de cancer" : "Notă (opțional)"}
                  value={condition.note ?? ""}
                  maxLength={300}
                  onChange={(e) => update(index, { note: e.target.value || null })}
                  className={inputClass}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-xl border border-border">
        <label htmlFor={searchId} className="sr-only">
          Caută o afecțiune
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută o afecțiune (ex. astm, diabet)…"
          className="w-full rounded-t-xl border-b border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="max-h-56 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="p-2 text-muted-foreground">
              Nicio potrivire. Alegeți „Altele” din categoria Altele și descrieți afecțiunea.
            </p>
          ) : (
            results.map((category) => (
              <div key={category.id} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{category.label}</p>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {category.conditions.map((condition) => {
                    const selected = condition.code !== "other" && selectedCodes.has(condition.code);
                    return (
                      <button
                        key={condition.code}
                        type="button"
                        disabled={selected}
                        onClick={() => add(condition.code)}
                        title={condition.hint}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/70 disabled:bg-foreground disabled:text-background"
                      >
                        {selected ? "✓ " : "+ "}
                        {condition.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {CONDITION_CATEGORIES.reduce((sum, c) => sum + c.conditions.length, 0)} afecțiuni în {CONDITION_CATEGORIES.length}{" "}
        categorii. Vârsta la debut este opțională.
      </p>
    </div>
  );
}
