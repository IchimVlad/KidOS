import "server-only";

import type {
  HydrationLog as DbHydrationLog,
  NutritionEntry as DbNutritionEntry,
} from "@prisma/client";
import {
  ageYearsFromDob,
  isoDateToDbDate,
  mapFoodGroup,
  mapFoodGroupToDb,
  mapMealType,
  mapMealTypeToDb,
  mapRelationFromDb,
  mapSex,
  toIsoDate,
  toIsoDateTime,
} from "@/lib/data/mappers";
import { addDays } from "@/lib/nutrition/dates";
import type {
  CreateNutritionEntry,
  HydrationDay,
  NutritionEntry,
  NutritionMeasurement,
  NutritionPageData,
  UpsertHydration,
} from "@/lib/nutrition/types";
import { getPrismaClient } from "@/lib/prisma";

/** Etichetele folosite în `Measurement.label` (vezi seed-ul). */
const WEIGHT_LABEL = "Greutate";
const HEIGHT_LABEL = "Înălțime";

const DEFAULT_RANGE_DAYS = 7;

// Postgres acceptă orice UUID bine format; un id greșit trebuie să dea 404, nu eroare de interogare.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function mapNutritionEntry(entry: DbNutritionEntry): NutritionEntry {
  return {
    id: entry.id,
    date: toIsoDate(entry.date),
    mealType: mapMealType(entry.mealType),
    description: entry.description,
    foodGroups: entry.foodGroups.map(mapFoodGroup),
    hadReaction: entry.hadReaction,
    reactionNotes: entry.reactionNotes,
    notes: entry.notes,
    createdAt: toIsoDateTime(entry.createdAt),
  };
}

function mapHydration(log: DbHydrationLog): HydrationDay {
  return { date: toIsoDate(log.date), amountMl: log.amountMl };
}

function parseMeasurementValue(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mapMeasurement(
  measurement: { value: string | null; unit: string | null; recordedAt: Date } | undefined,
): NutritionMeasurement | null {
  if (!measurement?.value) {
    return null;
  }
  return {
    value: measurement.value,
    unit: measurement.unit,
    numericValue: parseMeasurementValue(measurement.value),
    recordedAt: toIsoDate(measurement.recordedAt),
  };
}

/**
 * Datele paginii de nutriție. Intervalul este inclusiv; implicit ultimele 7 zile (UTC).
 * Returnează `null` dacă profilul nu există.
 */
export async function getNutritionPageData(
  profileId: string,
  range?: { from: string; to: string },
): Promise<NutritionPageData | null> {
  if (!isUuid(profileId)) {
    return null;
  }

  const serverToday = toIsoDate(new Date());
  const to = range?.to ?? serverToday;
  const from = range?.from ?? addDays(to, -(DEFAULT_RANGE_DAYS - 1));
  const dateFilter = { gte: isoDateToDbDate(from), lte: isoDateToDbDate(to) };

  const prisma = getPrismaClient();
  const profile = await prisma.patientProfile.findUnique({
    where: { id: profileId },
    include: {
      relationshipsAsPatient: { orderBy: { createdAt: "asc" }, take: 1 },
      nutritionEntries: {
        where: { date: dateFilter },
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
      },
      hydrationLogs: { where: { date: dateFilter }, orderBy: { date: "desc" } },
      measurements: {
        where: { label: { in: [WEIGHT_LABEL, HEIGHT_LABEL] } },
        orderBy: { recordedAt: "desc" },
      },
    },
  });

  if (!profile) {
    return null;
  }

  const relationship = profile.relationshipsAsPatient[0] ?? null;
  const age = ageYearsFromDob(profile.dateOfBirth);

  return {
    person: {
      id: profile.id,
      firstName: profile.preferredName?.trim() || profile.firstName,
      relation: mapRelationFromDb(relationship?.type ?? null, age),
      sex: mapSex(profile.sex),
      allergies: profile.allergies?.trim() || null,
      chronicConditions: profile.chronicConditions?.trim() || null,
    },
    range: { from, to },
    serverToday,
    entries: profile.nutritionEntries.map(mapNutritionEntry),
    hydration: profile.hydrationLogs.map(mapHydration),
    measurements: {
      weight: mapMeasurement(profile.measurements.find((m) => m.label === WEIGHT_LABEL)),
      height: mapMeasurement(profile.measurements.find((m) => m.label === HEIGHT_LABEL)),
    },
  };
}

async function profileExists(profileId: string): Promise<boolean> {
  if (!isUuid(profileId)) {
    return false;
  }
  const profile = await getPrismaClient().patientProfile.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  return profile != null;
}

/** Returnează `null` dacă profilul nu există. */
export async function createNutritionEntry(
  profileId: string,
  input: CreateNutritionEntry,
): Promise<NutritionEntry | null> {
  if (!(await profileExists(profileId))) {
    return null;
  }

  const created = await getPrismaClient().nutritionEntry.create({
    data: {
      patientProfileId: profileId,
      date: isoDateToDbDate(input.date),
      mealType: mapMealTypeToDb(input.mealType),
      description: input.description,
      foodGroups: input.foodGroups.map(mapFoodGroupToDb),
      hadReaction: input.hadReaction,
      reactionNotes: input.reactionNotes,
      notes: input.notes,
    },
  });
  return mapNutritionEntry(created);
}

/** Returnează `false` dacă intrarea nu există. */
export async function deleteNutritionEntry(entryId: string): Promise<boolean> {
  if (!isUuid(entryId)) {
    return false;
  }
  const { count } = await getPrismaClient().nutritionEntry.deleteMany({
    where: { id: entryId },
  });
  return count > 0;
}

/** Setează cantitatea de apă pentru o zi. Returnează `null` dacă profilul nu există. */
export async function upsertHydration(
  profileId: string,
  input: UpsertHydration,
): Promise<HydrationDay | null> {
  if (!(await profileExists(profileId))) {
    return null;
  }

  const date = isoDateToDbDate(input.date);
  const log = await getPrismaClient().hydrationLog.upsert({
    where: { patientProfileId_date: { patientProfileId: profileId, date } },
    create: { patientProfileId: profileId, date, amountMl: input.amountMl },
    update: { amountMl: input.amountMl },
  });
  return mapHydration(log);
}
