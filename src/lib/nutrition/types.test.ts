import { describe, expect, it } from "vitest";
import { addDays, isIsoDate, lastDays, localDateKey } from "@/lib/nutrition/dates";
import {
  createNutritionEntrySchema,
  firstIssueMessage,
  upsertHydrationSchema,
} from "@/lib/nutrition/types";

const valid = {
  date: "2026-11-08",
  mealType: "lunch",
  description: "Supă de legume și pâine",
  foodGroups: ["vegetables", "grains"],
  hadReaction: false,
};

function messageOf(input: unknown): string | null {
  const result = createNutritionEntrySchema.safeParse(input);
  return result.success ? null : firstIssueMessage(result.error);
}

describe("createNutritionEntrySchema", () => {
  it("acceptă o intrare validă și normalizează câmpurile opționale", () => {
    const result = createNutritionEntrySchema.parse({ ...valid, notes: "   " });
    expect(result.notes).toBeNull();
    expect(result.reactionNotes).toBeNull();
    expect(result.description).toBe("Supă de legume și pâine");
  });

  it("aplică valorile implicite pentru grupe și reacție", () => {
    const result = createNutritionEntrySchema.parse({
      date: valid.date,
      mealType: "snack",
      description: "Măr",
    });
    expect(result.foodGroups).toEqual([]);
    expect(result.hadReaction).toBe(false);
  });

  it("cere detalii când a existat o reacție", () => {
    expect(messageOf({ ...valid, hadReaction: true })).toBe("Descrieți reacția observată.");
    expect(messageOf({ ...valid, hadReaction: true, reactionNotes: "  " })).toBe(
      "Descrieți reacția observată.",
    );
    expect(messageOf({ ...valid, hadReaction: true, reactionNotes: "Urticarie ușoară" })).toBeNull();
  });

  it("renunță la detaliile reacției când nu a existat reacție", () => {
    const result = createNutritionEntrySchema.parse({ ...valid, reactionNotes: "ceva" });
    expect(result.reactionNotes).toBeNull();
  });

  it("respectă limitele de lungime", () => {
    expect(messageOf({ ...valid, description: "" })).toBe("Descrieți masa.");
    expect(messageOf({ ...valid, description: "   " })).toBe("Descrieți masa.");
    expect(messageOf({ ...valid, description: "a".repeat(300) })).toBeNull();
    expect(messageOf({ ...valid, description: "a".repeat(301) })).toBe(
      "Descrierea poate avea cel mult 300 de caractere.",
    );
    expect(messageOf({ ...valid, notes: "a".repeat(500) })).toBeNull();
    expect(messageOf({ ...valid, notes: "a".repeat(501) })).toBe(
      "Notele pot avea cel mult 500 de caractere.",
    );
    expect(
      messageOf({ ...valid, hadReaction: true, reactionNotes: "a".repeat(501) }),
    ).toBe("Detaliile reacției pot avea cel mult 500 de caractere.");
  });

  it("respinge grupe repetate sau necunoscute", () => {
    expect(messageOf({ ...valid, foodGroups: ["fruits", "fruits"] })).toBe(
      "Grupele alimentare nu se pot repeta.",
    );
    expect(messageOf({ ...valid, foodGroups: ["pizza"] })).toBe(
      "Grupa alimentară nu este validă.",
    );
  });

  it("respinge tipuri de masă și date invalide", () => {
    expect(messageOf({ ...valid, mealType: "brunch" })).toBe("Alegeți tipul mesei.");
    expect(messageOf({ ...valid, date: "2026-02-30" })).toBe("Data nu este validă.");
    expect(messageOf({ ...valid, date: "08.11.2026" })).toBe("Data nu este validă.");
    expect(messageOf(null)).toBe("Date invalide.");
  });
});

describe("upsertHydrationSchema", () => {
  it("acceptă limitele 0 și 6000 ml", () => {
    expect(upsertHydrationSchema.safeParse({ date: "2026-11-08", amountMl: 0 }).success).toBe(true);
    expect(upsertHydrationSchema.safeParse({ date: "2026-11-08", amountMl: 6000 }).success).toBe(true);
  });

  it("respinge valori negative, prea mari sau zecimale", () => {
    for (const amountMl of [-1, 6001, 250.5, "250"]) {
      expect(upsertHydrationSchema.safeParse({ date: "2026-11-08", amountMl }).success).toBe(false);
    }
  });
});

describe("date calendaristice", () => {
  it("validează date reale", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
  });

  it("adună zile peste granițe de lună și an", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(lastDays("2026-11-02", 3)).toEqual(["2026-11-02", "2026-11-01", "2026-10-31"]);
  });

  it("folosește ziua locală, nu ziua UTC, pentru o oră târzie", () => {
    // 23:45 ora locală rămâne în aceeași zi calendaristică, indiferent de fusul orar.
    const lateEvening = new Date(2026, 10, 8, 23, 45);
    expect(localDateKey(lateEvening)).toBe("2026-11-08");
  });
});
