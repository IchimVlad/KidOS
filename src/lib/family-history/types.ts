import { z } from "zod";
import { CONDITION_CODES } from "@/lib/family-history/conditions";

// Relațiile din arbore, raportate la copil.
export const FAMILY_RELATIONS = [
  "mother",
  "father",
  "maternal_grandmother",
  "maternal_grandfather",
  "paternal_grandmother",
  "paternal_grandfather",
  "sister",
  "brother",
  "maternal_aunt",
  "maternal_uncle",
  "paternal_aunt",
  "paternal_uncle",
] as const;

export const familyRelationSchema = z.enum(FAMILY_RELATIONS);
export type FamilyRelation = z.infer<typeof familyRelationSchema>;

export const RELATION_LABEL: Record<FamilyRelation, string> = {
  mother: "Mamă",
  father: "Tată",
  maternal_grandmother: "Bunica maternă",
  maternal_grandfather: "Bunicul matern",
  paternal_grandmother: "Bunica paternă",
  paternal_grandfather: "Bunicul patern",
  sister: "Soră",
  brother: "Frate",
  maternal_aunt: "Mătușă (maternă)",
  maternal_uncle: "Unchi (matern)",
  paternal_aunt: "Mătușă (paternă)",
  paternal_uncle: "Unchi (patern)",
};

/** Formă scurtă, folosită în propoziții: „Astm la mamă și bunica maternă”. */
export const RELATION_SHORT: Record<FamilyRelation, string> = {
  mother: "mamă",
  father: "tată",
  maternal_grandmother: "bunica maternă",
  maternal_grandfather: "bunicul matern",
  paternal_grandmother: "bunica paternă",
  paternal_grandfather: "bunicul patern",
  sister: "soră",
  brother: "frate",
  maternal_aunt: "mătușa maternă",
  maternal_uncle: "unchiul matern",
  paternal_aunt: "mătușa paternă",
  paternal_uncle: "unchiul patern",
};

/** Relațiile care pot apărea o singură dată în arbore. */
export const SINGLE_RELATIONS: FamilyRelation[] = [
  "mother",
  "father",
  "maternal_grandmother",
  "maternal_grandfather",
  "paternal_grandmother",
  "paternal_grandfather",
];

export const familyConditionSchema = z.object({
  code: z.enum(CONDITION_CODES),
  customLabel: z.string().trim().max(80).nullable().default(null),
  onsetAge: z.number().int().min(0).max(120).nullable().default(null),
  note: z.string().trim().max(300).nullable().default(null),
});

export type FamilyCondition = z.infer<typeof familyConditionSchema>;

const currentYear = new Date().getFullYear();

export const familyMemberInputSchema = z
  .object({
    relation: familyRelationSchema,
    displayName: z.string().trim().max(60).nullable().default(null),
    birthYear: z.number().int().min(1900).max(currentYear).nullable().default(null),
    vitalStatus: z.enum(["alive", "deceased"]).default("alive"),
    ageAtDeath: z.number().int().min(0).max(120).nullable().default(null),
    causeOfDeath: z.string().trim().max(200).nullable().default(null),
    // known = are afecțiuni în listă; none = „Nu există afecțiuni cunoscute”; unknown = „Nu știu”
    conditionsStatus: z.enum(["known", "none", "unknown"]).default("unknown"),
    conditions: z.array(familyConditionSchema).max(30).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.conditionsStatus === "known" && value.conditions.length === 0) {
      ctx.addIssue({ code: "custom", path: ["conditions"], message: "Adăugați cel puțin o afecțiune sau alegeți altă opțiune." });
    }
    if (value.conditions.some((c) => c.code === "other" && !c.customLabel)) {
      ctx.addIssue({ code: "custom", path: ["conditions"], message: "Descrieți afecțiunea aleasă la „Altele”." });
    }
  });

export type FamilyMemberInput = z.input<typeof familyMemberInputSchema>;

export type FamilyMember = z.output<typeof familyMemberInputSchema> & {
  id: string;
  childProfileId: string;
  updatedAt: string;
};

/** Un factor de risc: aceeași afecțiune, la una sau mai multe rude. */
export type FamilyRiskFactor = {
  code: string;
  label: string;
  relatives: { relation: FamilyRelation; onsetAge: number | null; note: string | null }[];
  sentence: string;
};

export type FamilyRiskSummary = {
  childProfileId: string;
  generatedAt: string;
  factors: FamilyRiskFactor[];
  membersRecorded: number;
  membersUnknown: number;
  /** Text gata de trimis ca context modulului de triaj AI. */
  text: string;
};
