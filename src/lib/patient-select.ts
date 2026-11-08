import { z } from "zod";

export const patientRelationSchema = z.enum([
  "self",
  "child",
  "adult",
  "elder",
]);

export type PatientRelation = z.infer<typeof patientRelationSchema>;

export const patientSexSchema = z.enum(["female", "male"]);

export type PatientSex = z.infer<typeof patientSexSchema>;

export const patientProfileSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).max(40),
  relation: patientRelationSchema,
  sex: patientSexSchema,
});

export type PatientProfile = z.infer<typeof patientProfileSchema>;

export const RELATION_LABEL: Record<PatientRelation, string> = {
  self: "Pentru mine",
  child: "Copil",
  adult: "Alt adult",
  elder: "Persoană vârstnică",
};

export const SEX_LABEL: Record<PatientSex, string> = {
  female: "Fată",
  male: "Băiat",
};
