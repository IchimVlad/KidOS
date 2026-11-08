import type { FamilyMemberInput } from "@/lib/family-history/types";

// Familie demonstrativă, completată pentru profilul Laura. Date fictive.
export const DEMO_FAMILY_PROFILE_ID = "profile_laura";

export const DEMO_FAMILY: FamilyMemberInput[] = [
  {
    relation: "mother",
    displayName: "Ioana",
    birthYear: 1992,
    conditionsStatus: "known",
    conditions: [
      { code: "asthma", onsetAge: 7, note: "Controlat cu tratament inhalator." },
      { code: "allergic_rhinitis", onsetAge: 15, note: null },
    ],
  },
  {
    relation: "father",
    displayName: "Mihai",
    birthYear: 1989,
    conditionsStatus: "known",
    conditions: [{ code: "migraine", onsetAge: 20, note: null }],
  },
  {
    relation: "maternal_grandmother",
    displayName: "Elena",
    birthYear: 1965,
    conditionsStatus: "known",
    conditions: [
      { code: "asthma", onsetAge: 40, note: null },
      { code: "thyroid_disease", onsetAge: 45, note: "Hipotiroidism." },
    ],
  },
  {
    relation: "maternal_grandfather",
    displayName: "Gheorghe",
    birthYear: 1960,
    vitalStatus: "deceased",
    ageAtDeath: 62,
    causeOfDeath: "Infarct miocardic",
    conditionsStatus: "known",
    conditions: [
      { code: "hypertension", onsetAge: 45, note: null },
      { code: "diabetes_t2", onsetAge: 55, note: null },
    ],
  },
  {
    relation: "paternal_grandmother",
    displayName: "Maria",
    birthYear: 1963,
    conditionsStatus: "known",
    conditions: [{ code: "diabetes_t2", onsetAge: 58, note: null }],
  },
  {
    relation: "paternal_grandfather",
    birthYear: 1958,
    conditionsStatus: "unknown",
  },
  {
    relation: "brother",
    displayName: "Tudor",
    birthYear: 2019,
    conditionsStatus: "known",
    conditions: [{ code: "febrile_seizures", onsetAge: 2, note: "Un singur episod." }],
  },
];
