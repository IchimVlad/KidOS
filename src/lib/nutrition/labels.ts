import type { FoodGroup, MealType } from "@/lib/nutrition/types";

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Mic dejun",
  lunch: "Prânz",
  dinner: "Cină",
  snack: "Gustare",
};

/** Ordinea meselor în jurnal. */
export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const FOOD_GROUP_LABEL: Record<FoodGroup, string> = {
  vegetables: "Legume",
  fruits: "Fructe",
  grains: "Cereale",
  protein: "Proteine",
  dairy: "Lactate",
  fats: "Grăsimi",
  sweets: "Dulciuri",
};

const WEEKDAYS_RO = ["dum.", "lun.", "mar.", "mie.", "joi", "vin.", "sâm."];
const MONTHS_RO = [
  "ian.",
  "feb.",
  "mar.",
  "apr.",
  "mai",
  "iun.",
  "iul.",
  "aug.",
  "sept.",
  "oct.",
  "nov.",
  "dec.",
];

/** „8 nov.” pentru o dată „YYYY-MM-DD”. */
export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return `${date.getUTCDate()} ${MONTHS_RO[date.getUTCMonth()]}`;
}

/** „Azi”, „Ieri” sau „lun. 3”. */
export function formatDayChip(isoDate: string, today: string, yesterday: string): string {
  if (isoDate === today) {
    return "Azi";
  }
  if (isoDate === yesterday) {
    return "Ieri";
  }
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return `${WEEKDAYS_RO[date.getUTCDay()]} ${date.getUTCDate()}`;
}
