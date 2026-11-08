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

export const activePatientSchema = z.object({
  profileId: z.string().min(1),
});

export type ActivePatient = z.infer<typeof activePatientSchema>;

export const ACTIVE_PATIENT_STORAGE_KEY = "active-patient";

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

export const DEMO_PROFILES: PatientProfile[] = [
  {
    id: "profile_andi",
    firstName: "Andi",
    relation: "self",
    sex: "male",
  },
  {
    id: "profile_laura",
    firstName: "Laura",
    relation: "child",
    sex: "female",
  },
];
