import "server-only";

import { formatConsultationTitle } from "@/lib/consultations/format";
import {
  ageLabelFromDob,
  ageYearsFromDob,
  consultationStatusLabel,
  mapConsultationStatus,
  mapDocumentType,
  mapInfoSource,
  mapRelationFromDb,
  mapSex,
  mapTimelineEventType,
  medicalEventSourceLabel,
  toIsoDate,
} from "@/lib/data/mappers";
import { filterPersistentMeasurements } from "@/lib/patient-dashboard/measurements";
import type { PatientDashboard } from "@/lib/patient-dashboard/types";
import { splitMedicalProfileValues } from "@/lib/medical-extraction";
import { getPrismaClient } from "@/lib/prisma";

const ACTIVE_CONSULTATION_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "IN_PROGRESS",
] as const;

function mapProfileMedicalValues(value: string | null) {
  const items = splitMedicalProfileValues(value);
  return items.length > 0
    ? items.map((text) => ({ text }))
    : [{ text: null }];
}

export async function getPatientDashboardById(
  patientId: string,
): Promise<PatientDashboard | null> {
  const prisma = getPrismaClient();
  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      relationshipsAsPatient: { orderBy: { createdAt: "asc" }, take: 1 },
      measurements: { orderBy: { recordedAt: "desc" } },
      documents: { orderBy: { date: "desc" } },
      prescriptions: { orderBy: { date: "desc" } },
      timelineEvents: {
        orderBy: { recordedAt: "desc" },
        include: {
          documents: { select: { id: true } },
          prescriptions: { select: { id: true } },
        },
      },
      requestedConsultations: {
        where: { status: { in: [...ACTIVE_CONSULTATION_STATUSES] } },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!profile) {
    return null;
  }

  const relationship = profile.relationshipsAsPatient[0] ?? null;
  const age = ageYearsFromDob(profile.dateOfBirth);
  const active = profile.requestedConsultations[0] ?? null;

  return {
    person: {
      id: profile.id,
      firstName: profile.preferredName?.trim() || profile.firstName,
      relation: mapRelationFromDb(relationship?.type ?? null, age),
      sex: mapSex(profile.sex),
      ageYears: age,
      ageLabel: ageLabelFromDob(profile.dateOfBirth),
      editDetails: {
        preferredName: profile.preferredName,
        notes: profile.notes,
      },
    },
    health: {
      allergies: mapProfileMedicalValues(profile.allergies),
      conditions: mapProfileMedicalValues(profile.chronicConditions),
      currentTreatments: mapProfileMedicalValues(profile.currentTreatments),
      measurements: filterPersistentMeasurements(profile.measurements).map(
        (measurement) => ({
          id: measurement.id,
          label: measurement.label,
          value: measurement.value,
          unit: measurement.unit,
          recordedAt: toIsoDate(measurement.recordedAt),
          source: mapInfoSource(measurement.source),
        }),
      ),
    },
    coverage: {
      familyDoctor: profile.familyDoctor,
      attendingDoctors: profile.attendingDoctors,
      insurance: profile.insurance,
    },
    events: profile.timelineEvents.map((event) => ({
      id: event.id,
      type: mapTimelineEventType(event.eventType),
      date: toIsoDate(event.recordedAt),
      title: event.title,
      summary: event.summary ?? "",
      source: medicalEventSourceLabel(event.source),
      detail: event.detail ?? event.summary ?? "",
      documentIds: event.documents.map((document) => document.id),
      prescriptionIds: event.prescriptions.map(
        (prescription) => prescription.id,
      ),
      hasAttachment: event.documents.length > 0,
    })),
    documents: profile.documents.map((document) => ({
      id: document.id,
      title: document.title,
      type: mapDocumentType(document.type),
      date: toIsoDate(document.date),
      eventId: document.timelineEventId,
      preview: document.preview,
    })),
    prescriptions: profile.prescriptions.map((prescription) => ({
      id: prescription.id,
      title: prescription.title,
      date: toIsoDate(prescription.date),
      doctorName: prescription.doctorName,
      instructions: prescription.instructions,
      eventId: prescription.timelineEventId,
    })),
    activeConsultation: active
      ? {
          id: active.id,
          title: formatConsultationTitle(active.createdAt),
          status: mapConsultationStatus(active.status),
          statusLabel: consultationStatusLabel(active.status),
        }
      : null,
  };
}
