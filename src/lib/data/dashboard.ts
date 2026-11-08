import "server-only";

import {
  ageLabelFromDob,
  ageYearsFromDob,
  consultationStatusLabel,
  mapDocumentType,
  mapInfoSource,
  mapRelationFromDb,
  mapSex,
  mapTimelineEventType,
  medicalEventSourceLabel,
  toIsoDate,
  toIsoDateTime,
} from "@/lib/data/mappers";
import type { PatientDashboard } from "@/lib/patient-dashboard/types";
import { getPrismaClient } from "@/lib/prisma";

const ACTIVE_CONSULTATION_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "IN_PROGRESS",
] as const;

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

  const allergies = profile.allergies
    ? [{ text: profile.allergies, source: "declared" as const }]
    : [{ text: null }];
  const conditions = profile.chronicConditions
    ? [{ text: profile.chronicConditions, source: "declared" as const }]
    : [{ text: null }];
  const currentTreatments = profile.currentTreatments
    ? [{ text: profile.currentTreatments, source: "declared" as const }]
    : [{ text: null }];

  return {
    person: {
      id: profile.id,
      firstName: profile.preferredName?.trim() || profile.firstName,
      relation: mapRelationFromDb(relationship?.type ?? null, age),
      sex: mapSex(profile.sex),
      ageLabel: ageLabelFromDob(profile.dateOfBirth),
      editDetails: {
        preferredName: profile.preferredName,
        notes: profile.notes,
      },
    },
    health: {
      allergies,
      conditions,
      currentTreatments,
      measurements: profile.measurements.map((measurement) => ({
        id: measurement.id,
        label: measurement.label,
        value: measurement.value,
        unit: measurement.unit,
        recordedAt: toIsoDate(measurement.recordedAt),
        source: mapInfoSource(measurement.source),
      })),
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
          title: `Consultație · ${toIsoDateTime(active.createdAt).slice(11, 16)}`,
          statusLabel: consultationStatusLabel(active.status),
        }
      : null,
  };
}
