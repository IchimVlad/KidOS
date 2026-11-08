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

export const BLOOD_TYPES = [
  "0(I) Rh+",
  "0(I) Rh-",
  "A(II) Rh+",
  "A(II) Rh-",
  "B(III) Rh+",
  "B(III) Rh-",
  "AB(IV) Rh+",
  "AB(IV) Rh-",
] as const;

export const bloodTypeSchema = z.enum(BLOOD_TYPES);

export type BloodType = z.infer<typeof bloodTypeSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

/** Detalii medicale opționale completate la adăugarea unei persoane. */
export const profileMedicalDetailsSchema = z.object({
  heightCm: z.number().min(20).max(250).optional(),
  weightKg: z.number().min(0.5).max(400).optional(),
  bloodType: bloodTypeSchema.optional(),
  allergies: optionalText(2000),
  chronicConditions: optionalText(2000),
  currentTreatments: optionalText(2000),
  pastSurgeries: optionalText(2000),
  vaccinationStatus: optionalText(2000),
  familyDoctor: optionalText(150),
  insurance: optionalText(150),
  emergencyContactName: optionalText(100),
  emergencyContactPhone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+0-9 ()./-]*$/, "Numărul de telefon nu este valid.")
    .optional()
    .transform((value) => (value ? value : undefined)),
  notes: optionalText(2000),
});

export type ProfileMedicalDetails = z.infer<typeof profileMedicalDetailsSchema>;
