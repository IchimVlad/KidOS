import "server-only";

import {
  ageLabelFromDob,
  mapConsultationStatus,
  mapSex,
  toIsoDate,
  toIsoDateTime,
} from "@/lib/data/mappers";
import { formatConsultationTitle } from "@/lib/consultations/format";
import type {
  ChatMessage,
  MessageDelivery,
} from "@/lib/consultations/types";
import type {
  DoctorConsultation,
  DoctorInboxTab,
  DoctorPatientContext,
} from "@/lib/doctor/types";
import { pickFormMeasurements } from "@/lib/patient-dashboard/measurements";
import { getPrismaClient } from "@/lib/prisma";
import type {
  ConsultationMessageSender,
  ConsultationStatus as DbConsultationStatus,
  MessageDeliveryStatus,
} from "@prisma/client";

function mapDelivery(delivery: MessageDeliveryStatus): MessageDelivery {
  return delivery === "SENT" ? "sent" : "pending";
}

function mapMessage(message: {
  id: string;
  content: string;
  createdAt: Date;
  sender: ConsultationMessageSender;
  delivery: MessageDeliveryStatus;
}): ChatMessage & { sender: "patient" | "doctor" } {
  return {
    id: message.id,
    text: message.content,
    sentAt: toIsoDateTime(message.createdAt),
    sender: message.sender === "DOCTOR" ? "doctor" : "patient",
    delivery: mapDelivery(message.delivery),
  };
}

function toDoctorConsultation(consultation: {
  id: string;
  patientProfileId: string;
  status: DbConsultationStatus;
  doctorNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    firstName: string;
    preferredName: string | null;
    sex: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
    dateOfBirth: Date;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
    sender: ConsultationMessageSender;
    delivery: MessageDeliveryStatus;
  }>;
}): DoctorConsultation {
  const messages = consultation.messages.map(mapMessage);
  const last = messages[messages.length - 1] ?? null;

  return {
    id: consultation.id,
    patientId: consultation.patientProfileId,
    patientName:
      consultation.patient.preferredName?.trim() ||
      consultation.patient.firstName,
    patientSex: mapSex(
      consultation.patient.sex === "FEMALE" ? "FEMALE" : "MALE",
    ),
    patientAgeLabel: ageLabelFromDob(consultation.patient.dateOfBirth),
    title: formatConsultationTitle(consultation.createdAt),
    status: mapConsultationStatus(consultation.status),
    doctorNotes: consultation.doctorNotes,
    waitingForDoctor: last?.sender === "patient",
    createdAt: toIsoDateTime(consultation.createdAt),
    updatedAt: toIsoDateTime(consultation.updatedAt),
    messages,
  };
}

const patientInclude = {
  patient: {
    select: {
      firstName: true,
      preferredName: true,
      sex: true,
      dateOfBirth: true,
    },
  },
  messages: { orderBy: { createdAt: "asc" as const } },
};

export async function listDoctorInbox(
  doctorId: string,
  tab: DoctorInboxTab,
): Promise<DoctorConsultation[]> {
  const prisma = getPrismaClient();

  const where =
    tab === "requested"
      ? {
          status: "REQUESTED" as const,
          OR: [{ doctorProfileId: null }, { doctorProfileId: doctorId }],
        }
      : tab === "active"
        ? {
            doctorProfileId: doctorId,
            status: {
              in: ["ACCEPTED", "IN_PROGRESS"] as DbConsultationStatus[],
            },
          }
        : {
            doctorProfileId: doctorId,
            status: {
              in: ["COMPLETED", "CANCELLED"] as DbConsultationStatus[],
            },
          };

  const consultations = await prisma.consultation.findMany({
    where,
    include: patientInclude,
    orderBy: { updatedAt: "desc" },
    take: tab === "closed" ? 40 : 100,
  });

  return consultations.map((consultation) =>
    toDoctorConsultation(consultation),
  );
}

export async function getDoctorConsultation(
  consultationId: string,
): Promise<DoctorConsultation | null> {
  const prisma = getPrismaClient();
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: patientInclude,
  });
  if (!consultation) {
    return null;
  }
  return toDoctorConsultation(consultation);
}

export async function acceptConsultation(input: {
  consultationId: string;
  doctorId: string;
}): Promise<DoctorConsultation | null> {
  const prisma = getPrismaClient();
  const existing = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: {
      id: true,
      status: true,
      doctorProfileId: true,
    },
  });
  if (!existing) {
    return null;
  }

  if (
    existing.status !== "REQUESTED" &&
    existing.status !== "ACCEPTED"
  ) {
    return getDoctorConsultation(existing.id);
  }

  if (
    existing.doctorProfileId != null &&
    existing.doctorProfileId !== input.doctorId
  ) {
    return null;
  }

  await prisma.consultation.update({
    where: { id: existing.id },
    data: {
      status: "IN_PROGRESS",
      doctorProfileId: input.doctorId,
      startedAt: new Date(),
    },
  });

  return getDoctorConsultation(existing.id);
}

export async function completeConsultation(input: {
  consultationId: string;
  doctorId: string;
}): Promise<DoctorConsultation | null> {
  const prisma = getPrismaClient();
  const existing = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: {
      id: true,
      status: true,
      doctorProfileId: true,
    },
  });
  if (!existing) {
    return null;
  }

  if (existing.doctorProfileId !== input.doctorId) {
    return null;
  }

  if (
    existing.status === "COMPLETED" ||
    existing.status === "CANCELLED"
  ) {
    return getDoctorConsultation(existing.id);
  }

  await prisma.consultation.update({
    where: { id: existing.id },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
    },
  });

  return getDoctorConsultation(existing.id);
}

export async function appendDoctorMessage(input: {
  consultationId: string;
  doctorId: string;
  text: string;
}): Promise<(ChatMessage & { sender: "patient" | "doctor" }) | null> {
  const trimmed = input.text.trim().slice(0, 2000);
  if (trimmed.length === 0) {
    return null;
  }

  const prisma = getPrismaClient();
  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: {
      id: true,
      status: true,
      doctorProfileId: true,
    },
  });
  if (!consultation) {
    return null;
  }

  if (
    consultation.status === "COMPLETED" ||
    consultation.status === "CANCELLED"
  ) {
    return null;
  }

  if (
    consultation.doctorProfileId != null &&
    consultation.doctorProfileId !== input.doctorId
  ) {
    return null;
  }

  if (
    consultation.status === "REQUESTED" ||
    consultation.doctorProfileId == null
  ) {
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: {
        status: "IN_PROGRESS",
        doctorProfileId: input.doctorId,
        startedAt: new Date(),
      },
    });
  } else if (consultation.status === "ACCEPTED") {
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  }

  const message = await prisma.consultationMessage.create({
    data: {
      consultationId: consultation.id,
      sender: "DOCTOR",
      content: trimmed,
      delivery: "SENT",
    },
  });

  await prisma.consultation.update({
    where: { id: consultation.id },
    data: { updatedAt: new Date() },
  });

  return mapMessage(message);
}

export async function updateDoctorNotes(input: {
  consultationId: string;
  doctorId: string;
  notes: string;
}): Promise<DoctorConsultation | null> {
  const prisma = getPrismaClient();
  const existing = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: { id: true, doctorProfileId: true, status: true },
  });
  if (!existing) {
    return null;
  }

  if (
    existing.doctorProfileId != null &&
    existing.doctorProfileId !== input.doctorId
  ) {
    return null;
  }

  await prisma.consultation.update({
    where: { id: existing.id },
    data: {
      doctorNotes: input.notes.trim().slice(0, 5000) || null,
      doctorProfileId: existing.doctorProfileId ?? input.doctorId,
    },
  });

  return getDoctorConsultation(existing.id);
}

export async function getDoctorPatientContext(
  patientId: string,
): Promise<DoctorPatientContext | null> {
  const prisma = getPrismaClient();
  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      measurements: { orderBy: { recordedAt: "desc" }, take: 20 },
      timelineEvents: { orderBy: { recordedAt: "desc" }, take: 5 },
      prescriptions: { orderBy: { date: "desc" }, take: 5 },
      documents: { orderBy: { date: "desc" }, take: 5 },
    },
  });

  if (!profile) {
    return null;
  }

  return {
    patientId: profile.id,
    patientName: profile.preferredName?.trim() || profile.firstName,
    patientSex: mapSex(profile.sex === "FEMALE" ? "FEMALE" : "MALE"),
    ageLabel: ageLabelFromDob(profile.dateOfBirth),
    allergies: profile.allergies,
    conditions: profile.chronicConditions,
    bloodType: profile.bloodType,
    currentTreatments: profile.currentTreatments,
    pastSurgeries: profile.pastSurgeries,
    vaccinationStatus: profile.vaccinationStatus,
    notes: profile.notes,
    emergencyContact:
      [profile.emergencyContactName, profile.emergencyContactPhone]
        .filter(Boolean)
        .join(" · ") || null,
    measurements: pickFormMeasurements(
      profile.measurements.map((measurement) => ({
        id: measurement.id,
        label: measurement.label,
        value: measurement.value ?? "",
        unit: measurement.unit,
        recordedAt: toIsoDate(measurement.recordedAt),
        source: measurement.source === "DECLARED" ? "declared" : "consultation",
      })),
    ),
    events: profile.timelineEvents.map((event) => ({
      id: event.id,
      title: event.title,
      date: toIsoDate(event.recordedAt),
      summary: event.summary ?? "",
    })),
    prescriptions: profile.prescriptions.map((prescription) => ({
      id: prescription.id,
      title: prescription.title,
      date: toIsoDate(prescription.date),
      doctorName: prescription.doctorName,
    })),
    documents: profile.documents.map((document) => ({
      id: document.id,
      title: document.title,
      date: toIsoDate(document.date),
    })),
  };
}
