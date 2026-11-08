import type { InfoSource } from "@/lib/patient-dashboard/types";

/** Anthropometrics from the create-profile form — not episodic vitals. */
const PERSISTENT_MEASUREMENT_LABELS = new Set([
  "înălțime",
  "inaltime",
  "greutate",
  "height",
  "weight",
]);

export function isPersistentMeasurement(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return PERSISTENT_MEASUREMENT_LABELS.has(normalized);
}

export function filterPersistentMeasurements<T extends { label: string }>(
  measurements: T[],
): T[] {
  return measurements.filter((item) => isPersistentMeasurement(item.label));
}

type MeasurementPickInput = {
  label: string;
  source?: InfoSource | string | null;
  recordedAt?: string | null;
};

/**
 * One value per label. Prefers form-declared (`declared`) over consultation
 * seed/demo values, then the most recent by date.
 */
export function pickFormMeasurements<T extends MeasurementPickInput>(
  measurements: T[],
): T[] {
  const persistent = filterPersistentMeasurements(measurements);
  const byLabel = new Map<string, T>();

  for (const item of persistent) {
    const key = item.label.trim().toLowerCase();
    const existing = byLabel.get(key);
    if (existing == null) {
      byLabel.set(key, item);
      continue;
    }

    const itemDeclared = isDeclaredSource(item.source);
    const existingDeclared = isDeclaredSource(existing.source);
    if (itemDeclared && !existingDeclared) {
      byLabel.set(key, item);
      continue;
    }
    if (itemDeclared === existingDeclared && isNewer(item, existing)) {
      byLabel.set(key, item);
    }
  }

  const order = ["înălțime", "inaltime", "greutate", "height", "weight"];
  return [...byLabel.entries()]
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([, value]) => value);
}

function isDeclaredSource(source: InfoSource | string | null | undefined): boolean {
  if (source == null) {
    return false;
  }
  return String(source).toLowerCase() === "declared";
}

function isNewer(
  candidate: MeasurementPickInput,
  current: MeasurementPickInput,
): boolean {
  const a = candidate.recordedAt ?? "";
  const b = current.recordedAt ?? "";
  return a > b;
}
