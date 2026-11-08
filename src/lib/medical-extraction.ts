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

export function mergeMedicalFacts(
  existing: string | null,
  facts: MedicalFact[],
): string | null {
  const lines = (existing ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const known = new Set(lines.map((line) => line.toLocaleLowerCase()));

  for (const fact of facts) {
    const value = fact.value.trim();
    const normalized = value.toLocaleLowerCase();
    if (value && !known.has(normalized)) {
      lines.push(value);
      known.add(normalized);
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}
