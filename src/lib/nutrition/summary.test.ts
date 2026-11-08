import { describe, expect, it } from "vitest";
import { buildDailySummary, buildNutritionSummary } from "@/lib/nutrition/summary";
import type { FoodGroup, NutritionEntry } from "@/lib/nutrition/types";

let counter = 0;
function entry(
  date: string,
  foodGroups: FoodGroup[],
  extra: Partial<NutritionEntry> = {},
): NutritionEntry {
  counter += 1;
  return {
    id: `entry-${counter}`,
    date,
    mealType: "lunch",
    description: "Masă",
    foodGroups,
    hadReaction: false,
    reactionNotes: null,
    notes: null,
    createdAt: `${date}T12:00:00.000Z`,
    ...extra,
  };
}

describe("buildDailySummary", () => {
  it("calculează grupele acoperite și lipsă doar pentru ziua cerută", () => {
    const entries = [
      entry("2026-11-08", ["vegetables", "grains"]),
      entry("2026-11-08", ["fruits", "sweets"], { hadReaction: true, reactionNotes: "Erupție" }),
      entry("2026-11-07", ["dairy", "protein"]),
    ];
    const summary = buildDailySummary("2026-11-08", entries, [], "child");

    expect(summary.mealsCount).toBe(2);
    expect(summary.reactionsCount).toBe(1);
    expect(summary.coveredGroups).toEqual(["vegetables", "fruits", "grains", "sweets"]);
    expect(summary.missingGroups).toEqual(["protein", "dairy"]);
  });

  it("compară apa consumată cu ținta categoriei de vârstă", () => {
    const hydration = [
      { date: "2026-11-08", amountMl: 750 },
      { date: "2026-11-07", amountMl: 3000 },
    ];
    const child = buildDailySummary("2026-11-08", [], hydration, "child");
    expect(child.waterMl).toBe(750);
    expect(child.waterTargetMl).toBe(1500);
    expect(child.waterProgress).toBe(0.5);

    const adult = buildDailySummary("2026-11-07", [], hydration, "self");
    expect(adult.waterTargetMl).toBe(2000);
    expect(adult.waterProgress).toBe(1);
  });

  it("fără înregistrări, toate grupele recomandate lipsesc și apa e 0", () => {
    const summary = buildDailySummary("2026-11-08", [], [], "elder");
    expect(summary.waterMl).toBe(0);
    expect(summary.coveredGroups).toEqual([]);
    expect(summary.missingGroups).toHaveLength(5);
  });
});

describe("buildNutritionSummary", () => {
  const options = { today: "2026-11-08", relation: "child" as const, now: new Date("2026-11-08T10:00:00.000Z") };

  it("include doar reacțiile din ultimele 30 de zile, cele recente primele", () => {
    const entries = [
      entry("2026-10-09", ["fruits"], { hadReaction: true, reactionNotes: "Prea veche", description: "Căpșuni" }),
      entry("2026-10-10", ["dairy"], { hadReaction: true, reactionNotes: "Dureri abdominale", description: "Iaurt" }),
      entry("2026-11-06", ["protein"], { hadReaction: true, reactionNotes: "Urticarie", description: "Ou fiert" }),
    ];
    const summary = buildNutritionSummary(entries, null, options);

    expect(summary.windowStart).toBe("2026-10-10");
    expect(summary.reactions.map((reaction) => reaction.description)).toEqual(["Ou fiert", "Iaurt"]);
    expect(summary.text).toContain("Reacții raportate în ultimele 30 de zile");
    expect(summary.text).toContain("Ou fiert – Urticarie");
    expect(summary.text).not.toContain("Căpșuni");
  });

  it("semnalează grupele lipsă în cel puțin jumătate din zile, după minim 3 zile", () => {
    const allButDairy: FoodGroup[] = ["vegetables", "fruits", "grains", "protein"];
    const entries = [
      entry("2026-11-06", allButDairy),
      entry("2026-11-07", allButDairy),
      entry("2026-11-08", [...allButDairy, "dairy"]),
    ];
    const summary = buildNutritionSummary(entries, null, options);

    expect(summary.daysRecorded).toBe(3);
    expect(summary.frequentlyMissingGroups).toEqual([{ group: "dairy", missingDays: 2 }]);
    expect(summary.text).toContain("lactate (din 3 zile înregistrate)");
  });

  it("nu trage concluzii din mai puțin de 3 zile", () => {
    const summary = buildNutritionSummary([entry("2026-11-08", [])], null, options);
    expect(summary.frequentlyMissingGroups).toEqual([]);
  });

  it("menționează alergiile din profil și lipsa reacțiilor", () => {
    const summary = buildNutritionSummary([entry("2026-11-08", ["fruits"])], "Polen de graminee", options);
    expect(summary.text).toContain("Alergii declarate în profil: Polen de graminee");
    expect(summary.text).toContain("Nu au fost raportate reacții");
  });

  it("are un text scurt când nu există date", () => {
    const summary = buildNutritionSummary([], null, options);
    expect(summary.text).toBe("Profil nutrițional: nu există înregistrări în jurnalul alimentar.");
  });
});
