import type { PatientRelation, PatientSex } from "@/lib/patient-select";

export type InfoSource = "declared" | "consultation";

export type TimelineEventType =
  | "consultation"
  | "observation"
  | "analysis"
  | "vaccination"
  | "treatment_change"
  | "profile_update";

export type TimelineFilter =
  | "all"
  | "consultation"
  | "analysis"
  | "treatment"
  | "observation"
  | "profile";

export type DocumentType =
  | "analysis"
  | "letter"
  | "discharge"
  | "other";

export type DemoValue = {
  text: string | null;
  source?: InfoSource;
};

export type Measurement = {
  id: string;
  label: string;
  value: string | null;
  unit: string | null;
  recordedAt: string | null;
  source: InfoSource;
};

export type MedicalDocument = {
  id: string;
  title: string;
  type: DocumentType;
  date: string;
  eventId: string | null;
  preview: string;
};

export type Prescription = {
  id: string;
  title: string;
  date: string;
  doctorName: string;
  instructions: string;
  eventId: string | null;
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  summary: string;
  source: string;
  detail: string;
  documentIds: string[];
  prescriptionIds: string[];
  hasAttachment: boolean;
};

export type PatientPerson = {
  id: string;
  firstName: string;
  relation: PatientRelation;
  sex: PatientSex;
  ageLabel: string;
  editDetails: {
    preferredName: string | null;
    notes: string | null;
  };
};

export type HealthSummary = {
  allergies: DemoValue[];
  conditions: DemoValue[];
  currentTreatments: DemoValue[];
  measurements: Measurement[];
};

export type CareCoverage = {
  familyDoctor: string | null;
  attendingDoctors: string[];
  insurance: string | null;
};

export type ActiveConsultation = {
  id: string;
  title: string;
  statusLabel: string;
};

export type PatientDashboard = {
  person: PatientPerson;
  health: HealthSummary;
  coverage: CareCoverage;
  events: TimelineEvent[];
  documents: MedicalDocument[];
  prescriptions: Prescription[];
  activeConsultation: ActiveConsultation | null;
};
