import "server-only";

import { DEFAULT_PROFILE_SPACE_ID } from "@/lib/constants";
import {
  ageYearsFromDob,
  mapRelationFromDb,
  mapSex,
  mapSexToDb,
} from "@/lib/data/mappers";
import { getPrismaClient } from "@/lib/prisma";
import type { PatientProfile, PatientRelation, PatientSex } from "@/lib/patient-select";

export async function listProfilesForSpace(
  spaceId: string = DEFAULT_PROFILE_SPACE_ID,
): Promise<PatientProfile[]> {
  const prisma = getPrismaClient();
  const profiles = await prisma.patientProfile.findMany({
    where: { profileSpaceId: spaceId },
    include: {
      relationshipsAsPatient: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return profiles.map((profile) => {
    const relationship = profile.relationshipsAsPatient[0] ?? null;
    const age = ageYearsFromDob(profile.dateOfBirth);
    return {
      id: profile.id,
      firstName: profile.preferredName?.trim() || profile.firstName,
      relation: mapRelationFromDb(relationship?.type ?? null, age),
      sex: mapSex(profile.sex),
    };
  });
}

export async function createProfileInSpace(input: {
  firstName: string;
  lastName?: string;
  relation: PatientRelation;
  sex: PatientSex;
  dateOfBirth?: Date;
  spaceId?: string;
  managerProfileId?: string;
}): Promise<PatientProfile> {
  const prisma = getPrismaClient();
  const spaceId = input.spaceId ?? DEFAULT_PROFILE_SPACE_ID;
  const firstName = input.firstName.trim();
  const lastName = (input.lastName ?? "Popescu").trim() || "Popescu";
  const dateOfBirth =
    input.dateOfBirth ??
    (input.relation === "child"
      ? new Date("2018-01-01T00:00:00.000Z")
      : input.relation === "elder"
        ? new Date("1950-01-01T00:00:00.000Z")
        : new Date("1990-01-01T00:00:00.000Z"));

  const managerId =
    input.managerProfileId ??
    (
      await prisma.patientProfile.findFirst({
        where: {
          profileSpaceId: spaceId,
          relationshipsAsManager: { some: {} },
        },
        select: { id: true },
      })
    )?.id;

  const created = await prisma.patientProfile.create({
    data: {
      profileSpaceId: spaceId,
      firstName,
      lastName,
      dateOfBirth,
      sex: mapSexToDb(input.sex),
      preferredName: firstName,
    },
  });

  if (managerId && input.relation !== "self") {
    await prisma.profileRelationship.create({
      data: {
        managerProfileId: managerId,
        patientProfileId: created.id,
        type: input.relation === "child" ? "PARENT" : "FAMILY_MEMBER",
      },
    });
  }

  const age = ageYearsFromDob(created.dateOfBirth);
  return {
    id: created.id,
    firstName: created.preferredName?.trim() || created.firstName,
    relation: input.relation === "self" ? "self" : mapRelationFromDb(
      input.relation === "child" ? "PARENT" : "FAMILY_MEMBER",
      age,
    ),
    sex: mapSex(created.sex),
  };
}

export async function deleteProfile(profileId: string): Promise<boolean> {
  const prisma = getPrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      const consultationIds = (
        await tx.consultation.findMany({
          where: {
            OR: [
              { patientProfileId: profileId },
              { requestedByProfileId: profileId },
            ],
          },
          select: { id: true },
        })
      ).map((row) => row.id);

      if (consultationIds.length > 0) {
        await tx.consultationMessage.deleteMany({
          where: { consultationId: { in: consultationIds } },
        });
        await tx.consultation.deleteMany({
          where: { id: { in: consultationIds } },
        });
      }

      const triageIds = (
        await tx.triageSession.findMany({
          where: {
            OR: [
              { patientProfileId: profileId },
              { startedByProfileId: profileId },
            ],
          },
          select: { id: true },
        })
      ).map((row) => row.id);

      if (triageIds.length > 0) {
        await tx.medicalTimelineEvent.updateMany({
          where: { sourceSessionId: { in: triageIds } },
          data: { sourceSessionId: null },
        });
        await tx.triageMessage.deleteMany({
          where: { sessionId: { in: triageIds } },
        });
        await tx.triageSession.deleteMany({
          where: { id: { in: triageIds } },
        });
      }

      await tx.medicalDocument.deleteMany({
        where: { patientProfileId: profileId },
      });
      await tx.prescription.deleteMany({
        where: { patientProfileId: profileId },
      });
      await tx.measurement.deleteMany({
        where: { patientProfileId: profileId },
      });
      await tx.medicalTimelineEvent.deleteMany({
        where: {
          OR: [
            { patientProfileId: profileId },
            { recordedByProfileId: profileId },
          ],
        },
      });
      await tx.profileRelationship.deleteMany({
        where: {
          OR: [
            { managerProfileId: profileId },
            { patientProfileId: profileId },
          ],
        },
      });
      await tx.triageMessage.deleteMany({
        where: { senderProfileId: profileId },
      });
      await tx.patientProfile.delete({ where: { id: profileId } });
    });
    return true;
  } catch {
    return false;
  }
}
