import type {
  ConsultationStatus as DbConsultationStatus,
  DocumentType as DbDocumentType,
  InfoSource as DbInfoSource,
  PatientSex as DbPatientSex,
  ProfileRelationshipType,
  TimelineEventType as DbTimelineEventType,
} from "@prisma/client";
import type {
  DocumentType,
  InfoSource,
  TimelineEventType,
} from "@/lib/patient-dashboard/types";
import type { PatientRelation, PatientSex } from "@/lib/patient-select";
import type { ConsultationStatus } from "@/lib/consultations/types";

export function mapSex(sex: DbPatientSex): PatientSex {
  return sex === "FEMALE" ? "female" : "male";
}

export function mapSexToDb(sex: PatientSex): DbPatientSex {
  return sex === "female" ? "FEMALE" : "MALE";
}

export function mapInfoSource(source: DbInfoSource): InfoSource {
  return source === "CONSULTATION" ? "consultation" : "declared";
}

export function mapDocumentType(type: DbDocumentType): DocumentType {
  switch (type) {
    case "ANALYSIS":
      return "analysis";
    case "LETTER":
      return "letter";
    case "DISCHARGE":
      return "discharge";
    default:
      return "other";
  }
}

export function mapTimelineEventType(
  type: DbTimelineEventType,
): TimelineEventType {
  switch (type) {
    case "CONSULTATION":
      return "consultation";
    case "OBSERVATION":
      return "observation";
    case "ANALYSIS":
      return "analysis";
    case "VACCINATION":
      return "vaccination";
    case "TREATMENT_CHANGE":
      return "treatment_change";
    default:
      return "observation";
  }
}

export function mapConsultationStatus(
  status: DbConsultationStatus,
): ConsultationStatus {
  if (status === "REQUESTED") {
    return "pending";
  }
  if (status === "ACCEPTED" || status === "IN_PROGRESS") {
    return "in_progress";
  }
  return "closed";
}

export function consultationStatusLabel(
  status: DbConsultationStatus,
): string {
  switch (status) {
    case "REQUESTED":
      return "Așteaptă răspuns medic";
    case "ACCEPTED":
      return "Medic în conversație";
    case "IN_PROGRESS":
      return "Medic în conversație";
    case "COMPLETED":
      return "Consultație închisă";
    case "CANCELLED":
      return "Consultație anulată";
    default:
      return status;
  }
}

export function mapRelationFromDb(
  relationshipType: ProfileRelationshipType | null,
  ageYears: number,
): PatientRelation {
  if (relationshipType == null) {
    return "self";
  }
  if (relationshipType === "PARENT") {
    return "child";
  }
  if (ageYears >= 65) {
    return "elder";
  }
  return "adult";
}

export function ageYearsFromDob(dateOfBirth: Date, now = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function ageLabelFromDob(dateOfBirth: Date): string {
  const years = ageYearsFromDob(dateOfBirth);
  if (years < 1) {
    return "sub 1 an";
  }
  if (years === 1) {
    return "1 an";
  }
  return `${years} ani`;
}

export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

export function medicalEventSourceLabel(source: string): string {
  if (source === "DOCTOR") {
    return "Medic";
  }
  if (source === "AI_TRIAGE") {
    return "Triaj";
  }
  return "Profil";
}
