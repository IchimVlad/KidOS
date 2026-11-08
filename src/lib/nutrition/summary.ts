import { addDays } from "@/lib/nutrition/dates";
import { FOOD_GROUP_LABEL, MEAL_TYPE_LABEL, formatShortDate } from "@/lib/nutrition/labels";
import { recommendationFor } from "@/lib/nutrition/recommendations";
import {
  FOOD_GROUPS,
  type FoodGroup,
  type HydrationDay,
  type NutritionEntry,
} from "@/lib/nutrition/types";
import type { PatientRelation } from "@/lib/patient-select";

export const REACTION_WINDOW_DAYS = 30;

/** Câte zile cu înregistrări sunt necesare pentru a semnala o grupă lipsă frecvent. */
const MIN_DAYS_FOR_PATTERN = 3;

export type DailySummary = {
  date: string;
  mealsCount: number;
  reactionsCount: number;
  /** Toate grupele întâlnite în ziua respectivă, în ordinea din catalog. */
  coveredGroups: FoodGroup[];
  /** Grupele recomandate zilnic care nu apar în jurnal. */
  missingGroups: FoodGroup[];
  waterMl: number;
  waterTargetMl: number;
  /** Între 0 și 1. */
  waterProgress: number;
};

export function buildDailySummary(
  date: string,
  entries: NutritionEntry[],
  hydration: HydrationDay[],
  relation: PatientRelation,
): DailySummary {
  const recommendation = recommendationFor(relation);
  const dayEntries = entries.filter((entry) => entry.date === date);
  const present = new Set(dayEntries.flatMap((entry) => entry.foodGroups));
  const waterMl = hydration.find((day) => day.date === date)?.amountMl ?? 0;

  return {
    date,
    mealsCount: dayEntries.length,
    reactionsCount: dayEntries.filter((entry) => entry.hadReaction).length,
    coveredGroups: FOOD_GROUPS.filter((group) => present.has(group)),
    missingGroups: recommendation.dailyGroups.filter((group) => !present.has(group)),
    waterMl,
    waterTargetMl: recommendation.waterTargetMl,
    waterProgress: Math.min(1, waterMl / recommendation.waterTargetMl),
  };
}

export type ReportedReaction = {
  entryId: string;
  date: string;
  mealType: NutritionEntry["mealType"];
  description: string;
  reactionNotes: string | null;
};

export type NutritionSummary = {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  daysRecorded: number;
  /** Cele mai recente primele. */
  reactions: ReportedReaction[];
  frequentlyMissingGroups: { group: FoodGroup; missingDays: number }[];
  /** Text gata de trimis ca context unui viitor modul de triaj. */
  text: string;
};

/**
 * Rezumatul „Profil nutrițional”: reacțiile raportate în ultimele 30 de zile și
 * grupele recomandate care lipsesc în cel puțin jumătate din zilele înregistrate.
 * Nu interpretează – doar sintetizează ce a declarat familia.
 */
export function buildNutritionSummary(
  entries: NutritionEntry[],
  allergies: string | null,
  options: { today: string; relation: PatientRelation; now?: Date },
): NutritionSummary {
  const windowEnd = options.today;
  const windowStart = addDays(windowEnd, -(REACTION_WINDOW_DAYS - 1));
  const inWindow = entries.filter(
    (entry) => entry.date >= windowStart && entry.date <= windowEnd,
  );

  const reactions = inWindow
    .filter((entry) => entry.hadReaction)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((entry) => ({
      entryId: entry.id,
      date: entry.date,
      mealType: entry.mealType,
      description: entry.description,
      reactionNotes: entry.reactionNotes,
    }));

  const groupsByDay = new Map<string, Set<FoodGroup>>();
  for (const entry of inWindow) {
    const groups = groupsByDay.get(entry.date) ?? new Set<FoodGroup>();
    entry.foodGroups.forEach((group) => groups.add(group));
    groupsByDay.set(entry.date, groups);
  }
  const daysRecorded = groupsByDay.size;

  const frequentlyMissingGroups =
    daysRecorded < MIN_DAYS_FOR_PATTERN
      ? []
      : recommendationFor(options.relation)
          .dailyGroups.map((group) => ({
            group,
            missingDays: [...groupsByDay.values()].filter((groups) => !groups.has(group)).length,
          }))
          .filter((item) => item.missingDays * 2 >= daysRecorded)
          .sort((a, b) => b.missingDays - a.missingDays);

  const lines: string[] = [];
  const allergyText = allergies?.trim();
  if (allergyText) {
    lines.push(`- Alergii declarate în profil: ${allergyText}`);
  }
  if (reactions.length === 0) {
    lines.push(`- Nu au fost raportate reacții la alimente în ultimele ${REACTION_WINDOW_DAYS} de zile.`);
  } else {
    lines.push(`- Reacții raportate în ultimele ${REACTION_WINDOW_DAYS} de zile:`);
    for (const reaction of reactions) {
      const details = reaction.reactionNotes ? ` – ${reaction.reactionNotes}` : "";
      lines.push(
        `  - ${formatShortDate(reaction.date)}, ${MEAL_TYPE_LABEL[reaction.mealType].toLowerCase()}: ${reaction.description}${details}`,
      );
    }
  }
  if (frequentlyMissingGroups.length > 0) {
    const groups = frequentlyMissingGroups.map((item) => FOOD_GROUP_LABEL[item.group].toLowerCase());
    lines.push(
      `- Grupe alimentare care lipsesc frecvent din jurnal: ${groups.join(", ")} (din ${daysRecorded} zile înregistrate).`,
    );
  }

  const text =
    daysRecorded === 0 && !allergyText
      ? "Profil nutrițional: nu există înregistrări în jurnalul alimentar."
      : `Profil nutrițional (jurnal declarat de familie, neverificat medical):\n${lines.join("\n")}`;

  return {
    generatedAt: (options.now ?? new Date()).toISOString(),
    windowStart,
    windowEnd,
    daysRecorded,
    reactions,
    frequentlyMissingGroups,
    text,
  };
}
