import { z } from "zod";
import {
  chatMessageSchema,
  consultationStatusSchema,
  type ConsultationStatus,
} from "@/lib/consultations/types";
import { patientSexSchema } from "@/lib/patient-select";

export const doctorSummarySchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1).max(100),
  specialty: z.string().nullable(),
  isOnline: z.boolean(),
});

export type DoctorSummary = z.infer<typeof doctorSummarySchema>;

export const doctorInboxTabSchema = z.enum([
  "requested",
  "active",
  "closed",
]);

export type DoctorInboxTab = z.infer<typeof doctorInboxTabSchema>;

export const doctorConsultationSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string().min(1).max(40),
  patientSex: patientSexSchema,
  patientAgeLabel: z.string().min(1).max(20),
  title: z.string().min(1).max(80),
  status: consultationStatusSchema,
  doctorNotes: z.string().nullable(),
  waitingForDoctor: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  messages: z.array(chatMessageSchema),
});

export type DoctorConsultation = z.infer<typeof doctorConsultationSchema>;

export type DoctorPatientContext = {
  patientId: string;
  patientName: string;
  patientSex: z.infer<typeof patientSexSchema>;
  ageLabel: string;
  allergies: string | null;
  conditions: string | null;
  bloodType: string | null;
  currentTreatments: string | null;
  pastSurgeries: string | null;
  vaccinationStatus: string | null;
  notes: string | null;
  emergencyContact: string | null;
  measurements: Array<{
    id: string;
    label: string;
    value: string;
    unit: string | null;
    recordedAt: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    date: string;
    summary: string;
  }>;
  prescriptions: Array<{
    id: string;
    title: string;
    date: string;
    doctorName: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    date: string;
  }>;
};

export const DOCTOR_TAB_LABEL: Record<DoctorInboxTab, string> = {
  requested: "De preluat",
  active: "În curs",
  closed: "Închise",
};

export function doctorStatusLabel(status: ConsultationStatus): string {
  if (status === "pending") {
    return "De preluat";
  }
  if (status === "in_progress") {
    return "În desfășurare";
  }
  return "Închisă";
}
