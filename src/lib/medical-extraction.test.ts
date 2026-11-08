import { describe, expect, it } from "vitest";
import {
  medicalExtractionSchema,
  mergeMedicalFacts,
  splitMedicalProfileValues,
} from "@/lib/medical-extraction";

describe("medical extraction", () => {
  it("validates the supported profile fields and evidence", () => {
    expect(
      medicalExtractionSchema.safeParse({
        allergies: [{ value: "Penicilină", evidence: "Sunt alergic la penicilină." }],
        chronicConditions: [],
        currentTreatments: [],
      }).success,
    ).toBe(true);

    expect(
      medicalExtractionSchema.safeParse({
        allergies: [{ value: "Penicilină", evidence: "" }],
        chronicConditions: [],
        currentTreatments: [],
      }).success,
    ).toBe(false);
  });

  it("appends new facts without replacing existing profile text or duplicating exact lines", () => {
    expect(
      mergeMedicalFacts("Astm", [
        { value: "astm", evidence: "Am astm." },
        { value: "Alergie la polen", evidence: "Alergic la polen." },
      ]),
    ).toBe("Astm\nAlergie la polen");
  });

  it("splits legacy list separators into individually displayable facts", () => {
    expect(
      splitMedicalProfileValues("diabet zaharat; astm\nalergie la polen"),
    ).toEqual(["Diabet zaharat", "Astm", "Alergie la polen"]);
    expect(
      mergeMedicalFacts("diabet zaharat; astm", [
        { value: "Astm", evidence: "Am astm." },
        { value: "Hipertensiune", evidence: "Am hipertensiune." },
      ]),
    ).toBe("Diabet zaharat\nAstm\nHipertensiune");
  });

  it("returns null when there is no existing information or selected fact", () => {
    expect(mergeMedicalFacts(null, [])).toBeNull();
  });
});
