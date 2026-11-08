import "server-only";

import type { DoctorSummary } from "@/lib/doctor/types";
import { getPrismaClient } from "@/lib/prisma";

export async function listDoctors(): Promise<DoctorSummary[]> {
  const prisma = getPrismaClient();
  const doctors = await prisma.doctorProfile.findMany({
    orderBy: [{ isOnline: "desc" }, { fullName: "asc" }],
  });

  return doctors.map((doctor) => ({
    id: doctor.id,
    fullName: doctor.fullName,
    specialty: doctor.specialty,
    isOnline: doctor.isOnline,
  }));
}

export async function getDoctorById(
  doctorId: string,
): Promise<DoctorSummary | null> {
  const prisma = getPrismaClient();
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
  });
  if (!doctor) {
    return null;
  }

  return {
    id: doctor.id,
    fullName: doctor.fullName,
    specialty: doctor.specialty,
    isOnline: doctor.isOnline,
  };
}

export async function assertDoctorExists(doctorId: string): Promise<boolean> {
  const prisma = getPrismaClient();
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });
  return doctor != null;
}
