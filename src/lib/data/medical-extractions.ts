import "server-only";

import {
  MEDICAL_EXTRACTION_CATEGORIES,
  medicalExtractionSchema,
  medicalExtractionSelectionSchema,
  mergeMedicalFacts,
  type MedicalExtraction,
  type MedicalExtractionSelection,
} from "@/lib/medical-extraction";
import { getPrismaClient } from "@/lib/prisma";
import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";

export function isMedicalExtractionMigrationMissing(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.meta?.modelName === "MedicalExtractionProposal"
  );
}

export type MedicalExtractionDraft = {
  id: string;
  createdAt: string;
  proposedData: MedicalExtraction;
};

function mapDraft(proposal: {
  id: string;
  createdAt: Date;
  proposedData: PrismaTypes.JsonValue;
}): MedicalExtractionDraft {
  const parsed = medicalExtractionSchema.safeParse(proposal.proposedData);
  if (!parsed.success) {
    throw new Error("Stored medical extraction proposal has invalid data.");
  }
  return {
    id: proposal.id,
    createdAt: proposal.createdAt.toISOString(),
    proposedData: parsed.data,
  };
}

export async function getMedicalExtractionInput(consultationId: string) {
  const prisma = getPrismaClient();
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: {
      patient: {
        select: { firstName: true, preferredName: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { sender: true, content: true },
      },
    },
  });

  if (!consultation) {
    return null;
  }

  return {
    patientName:
      consultation.patient.preferredName?.trim() ||
      consultation.patient.firstName,
    messages: consultation.messages.reverse().map((message) => ({
      sender:
        message.sender === "DOCTOR" ? ("doctor" as const) : ("patient" as const),
      text: message.content,
    })),
  };
}

export async function listMedicalExtractionDrafts(
  consultationId: string,
): Promise<MedicalExtractionDraft[]> {
  const prisma = getPrismaClient();
  const proposals = await prisma.medicalExtractionProposal.findMany({
    where: { consultationId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  return proposals.map(mapDraft);
}

export async function createMedicalExtractionDraft(input: {
  consultationId: string;
  proposedData: MedicalExtraction;
}): Promise<MedicalExtractionDraft> {
  const prisma = getPrismaClient();
  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: { id: true, patientProfileId: true },
  });
  if (!consultation) {
    throw new Error("Consultation was removed before the extraction was saved.");
  }

  const proposal = await prisma.medicalExtractionProposal.create({
    data: {
      consultationId: consultation.id,
      patientProfileId: consultation.patientProfileId,
      proposedData: input.proposedData as PrismaTypes.InputJsonValue,
    },
  });
  return mapDraft(proposal);
}

type ReviewResult =
  | { status: "updated"; proposalId: string }
  | {
      status:
        | "not-found"
        | "already-reviewed"
        | "invalid-selection"
        | "field-limit";
    };

export async function reviewMedicalExtraction(input: {
  consultationId: string;
  proposalId: string;
  action: "accept" | "reject";
  selected?: MedicalExtractionSelection;
}): Promise<ReviewResult> {
  const parsedSelection = medicalExtractionSelectionSchema.safeParse(
    input.selected,
  );
  if (input.action === "accept" && !parsedSelection.success) {
    return { status: "invalid-selection" };
  }

  const prisma = getPrismaClient();
  return prisma.$transaction(
    async (transaction) => {
      const proposal = await transaction.medicalExtractionProposal.findFirst({
        where: {
          id: input.proposalId,
          consultationId: input.consultationId,
        },
      });
      if (!proposal) {
        return { status: "not-found" };
      }
      if (proposal.status !== "PENDING") {
        return { status: "already-reviewed" };
      }

      if (input.action === "reject") {
        await transaction.medicalExtractionProposal.update({
          where: { id: proposal.id },
          data: { status: "REJECTED", reviewedAt: new Date() },
        });
        return { status: "updated", proposalId: proposal.id };
      }

      const data = medicalExtractionSchema.safeParse(proposal.proposedData);
      if (!data.success || !parsedSelection.success) {
        return { status: "invalid-selection" };
      }
      const selection = parsedSelection.data;
      const selectedFacts: MedicalExtraction = {
        allergies: [],
        chronicConditions: [],
        currentTreatments: [],
      };
      for (const category of MEDICAL_EXTRACTION_CATEGORIES) {
        const indices = selection[category];
        if (
          new Set(indices).size !== indices.length ||
          indices.some((index) => index >= data.data[category].length)
        ) {
          return { status: "invalid-selection" };
        }
        selectedFacts[category] = indices.map(
          (index) => data.data[category][index],
        );
      }

      const selectedCount = MEDICAL_EXTRACTION_CATEGORIES.reduce(
        (count, category) => count + selectedFacts[category].length,
        0,
      );
      if (selectedCount === 0) {
        return { status: "invalid-selection" };
      }

      const profile = await transaction.patientProfile.findUnique({
        where: { id: proposal.patientProfileId },
        select: {
          allergies: true,
          chronicConditions: true,
          currentTreatments: true,
        },
      });
      if (!profile) {
        return { status: "not-found" };
      }

      const profileUpdates = {
        ...(selectedFacts.allergies.length > 0
          ? {
              allergies: mergeMedicalFacts(
                profile.allergies,
                selectedFacts.allergies,
              ),
            }
          : {}),
        ...(selectedFacts.chronicConditions.length > 0
          ? {
              chronicConditions: mergeMedicalFacts(
                profile.chronicConditions,
                selectedFacts.chronicConditions,
              ),
            }
          : {}),
        ...(selectedFacts.currentTreatments.length > 0
          ? {
              currentTreatments: mergeMedicalFacts(
                profile.currentTreatments,
                selectedFacts.currentTreatments,
              ),
            }
          : {}),
      };
      if (
        Object.values(profileUpdates).some(
          (value) => value != null && value.length > 2000,
        )
      ) {
        return { status: "field-limit" };
      }

      await transaction.patientProfile.update({
        where: { id: proposal.patientProfileId },
        data: profileUpdates,
      });
      await transaction.medicalExtractionProposal.update({
        where: { id: proposal.id },
        data: { status: "ACCEPTED", reviewedAt: new Date() },
      });

      return { status: "updated", proposalId: proposal.id };
    },
    { isolationLevel: "Serializable" },
  );
}
