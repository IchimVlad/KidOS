import { z } from "zod";
import { isIsoDate } from "@/lib/nutrition/dates";
import type { PatientRelation, PatientSex } from "@/lib/patient-select";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const mealTypeSchema = z.enum(MEAL_TYPES);
export type MealType = z.infer<typeof mealTypeSchema>;

export const FOOD_GROUPS = [
  "vegetables",
  "fruits",
  "grains",
  "protein",
  "dairy",
  "fats",
  "sweets",
] as const;
export const foodGroupSchema = z.enum(FOOD_GROUPS);
export type FoodGroup = z.infer<typeof foodGroupSchema>;

export const MAX_HYDRATION_ML = 6000;

export const isoDateSchema = z
  .string({ error: "Data nu este validă." })
  .refine(isIsoDate, "Data nu este validă.");

/** Text opțional: spațiile se elimină, iar un text gol devine `null`. */
function optionalText(max: number, tooLong: string) {
  return z
    .string({ error: "Textul nu este valid." })
    .trim()
    .max(max, tooLong)
    .nullish()
    .transform((value) => (value ? value : null));
}

export const createNutritionEntrySchema = z
  .object({
    date: isoDateSchema,
    mealType: z.enum(MEAL_TYPES, { error: "Alegeți tipul mesei." }),
    description: z
      .string({ error: "Descrieți masa." })
      .trim()
      .min(1, "Descrieți masa.")
      .max(300, "Descrierea poate avea cel mult 300 de caractere."),
    foodGroups: z
      .array(z.enum(FOOD_GROUPS, { error: "Grupa alimentară nu este validă." }), {
        error: "Grupele alimentare nu sunt valide.",
      })
      .default([])
      .refine(
        (groups) => new Set(groups).size === groups.length,
        "Grupele alimentare nu se pot repeta.",
      ),
    hadReaction: z
      .boolean({ error: "Indicați dacă a existat o reacție." })
      .default(false),
    reactionNotes: optionalText(
      500,
      "Detaliile reacției pot avea cel mult 500 de caractere.",
    ),
    notes: optionalText(500, "Notele pot avea cel mult 500 de caractere."),
  }, { error: "Date invalide." })
  .superRefine((value, ctx) => {
    if (value.hadReaction && value.reactionNotes == null) {
      ctx.addIssue({
        code: "custom",
        path: ["reactionNotes"],
        message: "Descrieți reacția observată.",
      });
    }
  })
  // Fără reacție, detaliile reacției nu se păstrează.
  .transform((value) =>
    value.hadReaction ? value : { ...value, reactionNotes: null },
  );

export type CreateNutritionEntryInput = z.input<
  typeof createNutritionEntrySchema
>;
export type CreateNutritionEntry = z.output<typeof createNutritionEntrySchema>;

export const upsertHydrationSchema = z.object({
  date: isoDateSchema,
  amountMl: z
    .number({ error: "Cantitatea de apă nu este validă." })
    .int("Cantitatea de apă trebuie să fie un număr întreg.")
    .min(0, "Cantitatea de apă nu poate fi negativă.")
    .max(
      MAX_HYDRATION_ML,
      `Cantitatea de apă poate fi cel mult ${MAX_HYDRATION_ML} ml.`,
    ),
}, { error: "Date invalide." });

export type UpsertHydration = z.infer<typeof upsertHydrationSchema>;

/** Primul mesaj de validare, pentru afișare în UI sau în răspunsul API. */
export function firstIssueMessage(
  error: z.ZodError,
  fallback = "Date invalide.",
): string {
  return error.issues[0]?.message ?? fallback;
}

// ------------------------------------------------------
// Tipuri UI
// ------------------------------------------------------

export type NutritionEntry = {
  id: string;
  date: string;
  mealType: MealType;
  description: string;
  foodGroups: FoodGroup[];
  hadReaction: boolean;
  reactionNotes: string | null;
  notes: string | null;
  createdAt: string;
};

export type HydrationDay = {
  date: string;
  amountMl: number;
};

export type NutritionMeasurement = {
  value: string;
  unit: string | null;
  /** Valoarea numerică, dacă textul poate fi interpretat ca număr. */
  numericValue: number | null;
  recordedAt: string;
};

export type NutritionPageData = {
  person: {
    id: string;
    firstName: string;
    relation: PatientRelation;
    sex: PatientSex;
    allergies: string | null;
    chronicConditions: string | null;
  };
  range: { from: string; to: string };
  /** Ziua curentă pe server (UTC); clientul o înlocuiește cu ziua locală. */
  serverToday: string;
  entries: NutritionEntry[];
  hydration: HydrationDay[];
  measurements: {
    weight: NutritionMeasurement | null;
    height: NutritionMeasurement | null;
  };
};
