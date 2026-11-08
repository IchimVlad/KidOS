import "server-only";

import {
  mapConsultationStatus,
  toIsoDateTime,
} from "@/lib/data/mappers";
import { formatConsultationTitle } from "@/lib/consultations/format";
import type {
  ChatMessage,
  ConversationWithSenders,
  MessageDelivery,
} from "@/lib/consultations/types";
import { getPrismaClient } from "@/lib/prisma";
import type {
  ConsultationMessageSender,
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

export async function listConversationsForPatient(
  patientId: string,
): Promise<ConversationWithSenders[]> {
  const prisma = getPrismaClient();
  const consultations = await prisma.consultation.findMany({
    where: { patientProfileId: patientId },
    include: {
      patient: { select: { firstName: true, preferredName: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return consultations.map((consultation) => ({
    id: consultation.id,
    patientId: consultation.patientProfileId,
    patientName:
      consultation.patient.preferredName?.trim() ||
      consultation.patient.firstName,
    title: formatConsultationTitle(consultation.createdAt),
    status: mapConsultationStatus(consultation.status),
    createdAt: toIsoDateTime(consultation.createdAt),
    updatedAt: toIsoDateTime(consultation.updatedAt),
    messages: consultation.messages.map(mapMessage),
  }));
}

export async function createConsultationForPatient(input: {
  patientId: string;
  requestedByProfileId?: string;
  initialMessage?: string;
  totalFee?: number;
}): Promise<ConversationWithSenders> {
  const prisma = getPrismaClient();
  const patient = await prisma.patientProfile.findUnique({
    where: { id: input.patientId },
    include: {
      relationshipsAsPatient: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { managerProfileId: true },
      },
    },
  });

  if (!patient) {
    throw new Error("Profilul pacientului nu există.");
  }

  const requestedByProfileId =
    input.requestedByProfileId ??
    patient.relationshipsAsPatient[0]?.managerProfileId ??
    patient.id;

  const totalFee = input.totalFee ?? 150;
  const platformCommission = Math.round(totalFee * 0.15 * 100) / 100;

  const consultation = await prisma.consultation.create({
    data: {
      patientProfileId: patient.id,
      requestedByProfileId,
      status: "REQUESTED",
      totalFee,
      platformCommission,
      currency: "RON",
    },
    include: {
      patient: { select: { firstName: true, preferredName: true } },
      messages: true,
    },
  });

  const initialText = input.initialMessage?.trim().slice(0, 2000) ?? "";
  let messages: Array<ChatMessage & { sender: "patient" | "doctor" }> = [];

  if (initialText.length > 0) {
    const message = await prisma.consultationMessage.create({
      data: {
        consultationId: consultation.id,
        sender: "PATIENT",
        content: initialText,
        delivery: "PENDING",
      },
    });
    messages = [mapMessage(message)];
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: { updatedAt: new Date() },
    });
  }

  return {
    id: consultation.id,
    patientId: consultation.patientProfileId,
    patientName:
      consultation.patient.preferredName?.trim() ||
      consultation.patient.firstName,
    title: formatConsultationTitle(consultation.createdAt),
    status: mapConsultationStatus(consultation.status),
    createdAt: toIsoDateTime(consultation.createdAt),
    updatedAt: toIsoDateTime(consultation.updatedAt),
    messages,
  };
}

export async function appendConsultationMessage(input: {
  consultationId: string;
  text: string;
}): Promise<(ChatMessage & { sender: "patient" | "doctor" }) | null> {
  const trimmed = input.text.trim().slice(0, 2000);
  if (trimmed.length === 0) {
    return null;
  }

  const prisma = getPrismaClient();
  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: { id: true, status: true },
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

  const message = await prisma.consultationMessage.create({
    data: {
      consultationId: consultation.id,
      sender: "PATIENT",
      content: trimmed,
      delivery: "PENDING",
    },
  });

  await prisma.consultation.update({
    where: { id: consultation.id },
    data: { updatedAt: new Date() },
  });

  return mapMessage(message);
}

export async function deleteConsultation(
  consultationId: string,
): Promise<boolean> {
  const prisma = getPrismaClient();
  try {
    await prisma.consultation.delete({ where: { id: consultationId } });
    return true;
  } catch {
    return false;
  }
}
