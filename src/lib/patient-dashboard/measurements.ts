/** Anthropometrics kept on the profile summary — not episodic vitals. */
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
