import { z } from "zod";

export const medicalFactSchema = z.object({
  value: z.string().trim().min(1).max(300),
  evidence: z.string().trim().min(1).max(500),
});

export const medicalExtractionSchema = z.object({
  allergies: z.array(medicalFactSchema).max(10),
  chronicConditions: z.array(medicalFactSchema).max(10),
  currentTreatments: z.array(medicalFactSchema).max(10),
});

export type MedicalExtraction = z.infer<typeof medicalExtractionSchema>;
export type MedicalFact = z.infer<typeof medicalFactSchema>;
export type MedicalExtractionCategory = keyof MedicalExtraction;

export const medicalExtractionSelectionSchema = z.object({
  allergies: z.array(z.number().int().min(0)).max(10),
  chronicConditions: z.array(z.number().int().min(0)).max(10),
  currentTreatments: z.array(z.number().int().min(0)).max(10),
});

export type MedicalExtractionSelection = z.infer<
  typeof medicalExtractionSelectionSchema
>;

export const MEDICAL_EXTRACTION_CATEGORIES: MedicalExtractionCategory[] = [
  "allergies",
  "chronicConditions",
  "currentTreatments",
];

export const MEDICAL_EXTRACTION_LABEL: Record<
  MedicalExtractionCategory,
  string
> = {
  allergies: "Alergii",
  chronicConditions: "Afecțiuni cronice",
  currentTreatments: "Tratamente curente",
};

export function splitMedicalProfileValues(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|[;,•·]+/)
    .map((item) => item.replace(/^\s*[-*]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toLocaleUpperCase("ro-RO") + item.slice(1));
}

export function mergeMedicalFacts(
  existing: string | null,
  facts: MedicalFact[],
): string | null {
  const lines = splitMedicalProfileValues(existing);
  const known = new Set(lines.map((line) => line.toLocaleLowerCase()));

  for (const fact of facts) {
    for (const value of splitMedicalProfileValues(fact.value)) {
      const normalized = value.toLocaleLowerCase();
      if (!known.has(normalized)) {
        lines.push(value);
        known.add(normalized);
      }
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}
