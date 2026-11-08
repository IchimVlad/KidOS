import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const connectionString = process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED este necesar pentru a popula baza de date.");
}

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const daysAgo = (days, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000);

async function upsertById(delegate, record) {
  const { id, ...data } = record;
  await delegate.upsert({ where: { id }, create: record, update: data });
}

async function seed() {
  await upsertById(prisma.profileSpace, {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Familia Popescu — Brașov",
  });

  await upsertById(prisma.patientProfile, {
    id: "00000000-0000-4000-8000-000000000101",
    profileSpaceId: "00000000-0000-4000-8000-000000000001",
    firstName: "Andrei",
    lastName: "Popescu",
    dateOfBirth: new Date("1988-03-14T00:00:00.000Z"),
  });
  await upsertById(prisma.patientProfile, {
    id: "00000000-0000-4000-8000-000000000102",
    profileSpaceId: "00000000-0000-4000-8000-000000000001",
    firstName: "Maria",
    lastName: "Popescu",
    dateOfBirth: new Date("2016-05-22T00:00:00.000Z"),
    allergies: "Nu se cunosc alergii",
    chronicConditions: "Niciuna",
  });
  await upsertById(prisma.patientProfile, {
    id: "00000000-0000-4000-8000-000000000103",
    profileSpaceId: "00000000-0000-4000-8000-000000000001",
    firstName: "Vlad",
    lastName: "Popescu",
    dateOfBirth: new Date("2013-09-08T00:00:00.000Z"),
    allergies: "Polen sezonier",
  });

  await upsertById(prisma.profileRelationship, {
    id: "00000000-0000-4000-8000-000000000201",
    managerProfileId: "00000000-0000-4000-8000-000000000101",
    patientProfileId: "00000000-0000-4000-8000-000000000102",
    type: "PARENT",
  });
  await upsertById(prisma.profileRelationship, {
    id: "00000000-0000-4000-8000-000000000202",
    managerProfileId: "00000000-0000-4000-8000-000000000101",
    patientProfileId: "00000000-0000-4000-8000-000000000103",
    type: "PARENT",
  });

  await upsertById(prisma.doctorProfile, {
    id: "00000000-0000-4000-8000-000000000301",
    fullName: "Dr. Ioana Ionescu",
    licenseNumber: "DEMO-MEDIC-001",
    specialty: "Pediatrie",
    isOnline: true,
    pricePerConsultation: 180,
    currency: "RON",
    bio: "Profil fictiv de medic din Brașov, folosit pentru dezvoltare și testare.",
    isVerified: true,
  });
  await upsertById(prisma.doctorProfile, {
    id: "00000000-0000-4000-8000-000000000302",
    fullName: "Dr. Mihai Dumitrescu",
    licenseNumber: "DEMO-MEDIC-002",
    specialty: "Medicină de familie",
    isOnline: false,
    pricePerConsultation: 150,
    currency: "RON",
    bio: "Profil fictiv de medic din Brașov, folosit pentru dezvoltare și testare.",
    isVerified: true,
  });

  await upsertById(prisma.triageSession, {
    id: "00000000-0000-4000-8000-000000000401",
    patientProfileId: "00000000-0000-4000-8000-000000000102",
    startedByProfileId: "00000000-0000-4000-8000-000000000101",
    status: "COMPLETED",
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.triageSession, {
    id: "00000000-0000-4000-8000-000000000402",
    patientProfileId: "00000000-0000-4000-8000-000000000103",
    startedByProfileId: "00000000-0000-4000-8000-000000000101",
    status: "ACTIVE",
    createdAt: daysAgo(0, 1),
  });

  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000501",
    sessionId: "00000000-0000-4000-8000-000000000401",
    sender: "PROFILE",
    senderProfileId: "00000000-0000-4000-8000-000000000101",
    content: "Maria are o durere ușoară de cap de azi.",
    createdAt: daysAgo(3, 1),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000502",
    sessionId: "00000000-0000-4000-8000-000000000401",
    sender: "AI",
    content: "Răspuns demonstrativ: notați simptomele și contactați un medic dacă sunteți îngrijorați.",
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000503",
    sessionId: "00000000-0000-4000-8000-000000000402",
    sender: "PROFILE",
    senderProfileId: "00000000-0000-4000-8000-000000000101",
    content: "Vlad are o întrebare despre alergiile sezoniere.",
    createdAt: daysAgo(0, 1),
  });

  await upsertById(prisma.medicalTimelineEvent, {
    id: "00000000-0000-4000-8000-000000000601",
    patientProfileId: "00000000-0000-4000-8000-000000000102",
    recordedByProfileId: "00000000-0000-4000-8000-000000000101",
    sourceSessionId: "00000000-0000-4000-8000-000000000401",
    source: "AI_TRIAGE",
    symptom: "Durere ușoară de cap ",
    severity: "LOW",
    summary: "Date fictive pentru dezvoltare; nu reprezintă un document medical.",
    recordedAt: daysAgo(3),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: "00000000-0000-4000-8000-000000000602",
    patientProfileId: "00000000-0000-4000-8000-000000000103",
    recordedByProfileId: "00000000-0000-4000-8000-000000000101",
    doctorProfileId: "00000000-0000-4000-8000-000000000302",
    source: "DOCTOR",
    symptom: "Alergii sezoniere",
    severity: "LOW",
    summary: "Date fictive pentru dezvoltare; nu reprezintă un document medical.",
    recordedAt: daysAgo(14),
  });

  await upsertById(prisma.consultation, {
    id: "00000000-0000-4000-8000-000000000701",
    patientProfileId: "00000000-0000-4000-8000-000000000102",
    requestedByProfileId: "00000000-0000-4000-8000-000000000101",
    doctorProfileId: "00000000-0000-4000-8000-000000000301",
    triageSessionId: "00000000-0000-4000-8000-000000000401",
    status: "COMPLETED",
    totalFee: 180,
    platformCommission: 27,
    currency: "RON",
    doctorNotes: "Notă demonstrativă: consultație fictivă.",
    startedAt: daysAgo(2, 2),
    endedAt: daysAgo(2, 1),
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.consultation, {
    id: "00000000-0000-4000-8000-000000000702",
    patientProfileId: "00000000-0000-4000-8000-000000000103",
    requestedByProfileId: "00000000-0000-4000-8000-000000000101",
    triageSessionId: "00000000-0000-4000-8000-000000000402",
    status: "REQUESTED",
    totalFee: 150,
    platformCommission: 22.5,
    currency: "RON",
    createdAt: daysAgo(0, 1),
  });
}

try {
  await seed();
  console.info("Datele fictive au fost adăugate cu succes.");
} catch (error) {
  console.error("Nu s-au putut adăuga datele fictive:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
