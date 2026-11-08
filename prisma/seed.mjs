import { config as loadEnv } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

loadEnv({ path: ".env.local" });
loadEnv();

const connectionString = process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED este necesar pentru a popula baza de date.");
}

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const SPACE_ID = "00000000-0000-4000-8000-000000000001";
const ANDREI_ID = "00000000-0000-4000-8000-000000000101";
const MARIA_ID = "00000000-0000-4000-8000-000000000102";
const VLAD_ID = "00000000-0000-4000-8000-000000000103";
const DOCTOR_PED_ID = "00000000-0000-4000-8000-000000000301";
const DOCTOR_MF_ID = "00000000-0000-4000-8000-000000000302";
const EVENT_MARIA_ID = "00000000-0000-4000-8000-000000000601";
const EVENT_VLAD_ID = "00000000-0000-4000-8000-000000000602";
const EVENT_VLAD_VAX_ID = "00000000-0000-4000-8000-000000000603";
const CONSULT_MARIA_ID = "00000000-0000-4000-8000-000000000701";
const CONSULT_VLAD_ID = "00000000-0000-4000-8000-000000000702";

const daysAgo = (days, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000);

async function upsertById(delegate, record) {
  const { id, ...data } = record;
  await delegate.upsert({ where: { id }, create: record, update: data });
}

async function seed() {
  await upsertById(prisma.profileSpace, {
    id: SPACE_ID,
    name: "Familia Popescu — Brașov",
  });

  await upsertById(prisma.patientProfile, {
    id: ANDREI_ID,
    profileSpaceId: SPACE_ID,
    firstName: "Andrei",
    lastName: "Popescu",
    dateOfBirth: new Date("1988-03-14T00:00:00.000Z"),
    sex: "MALE",
    preferredName: "Andi",
    notes: "Preferă mesajele scurte.",
    allergies: "Nu se cunosc alergii",
    chronicConditions: "Niciuna",
    currentTreatments: null,
    familyDoctor: "Dr. Mihai Dumitrescu",
    insurance: "CAS — pachet de bază",
    attendingDoctors: ["Dr. Ioana Ionescu"],
  });
  await upsertById(prisma.patientProfile, {
    id: MARIA_ID,
    profileSpaceId: SPACE_ID,
    firstName: "Maria",
    lastName: "Popescu",
    dateOfBirth: new Date("2016-05-22T00:00:00.000Z"),
    sex: "FEMALE",
    preferredName: null,
    notes: "Preferă explicații simple.",
    allergies: "Nu se cunosc alergii",
    chronicConditions: "Niciuna",
    currentTreatments: null,
    familyDoctor: "Dr. Mihai Dumitrescu",
    insurance: "CAS — copil",
    attendingDoctors: ["Dr. Ioana Ionescu"],
  });
  await upsertById(prisma.patientProfile, {
    id: VLAD_ID,
    profileSpaceId: SPACE_ID,
    firstName: "Vlad",
    lastName: "Popescu",
    dateOfBirth: new Date("2013-09-08T00:00:00.000Z"),
    sex: "MALE",
    allergies: "Polen sezonier",
    chronicConditions: null,
    currentTreatments: "Antihistaminic la nevoie",
    familyDoctor: "Dr. Mihai Dumitrescu",
    insurance: "CAS — copil",
    attendingDoctors: ["Dr. Ioana Ionescu", "Dr. Mihai Dumitrescu"],
  });

  await upsertById(prisma.profileRelationship, {
    id: "00000000-0000-4000-8000-000000000201",
    managerProfileId: ANDREI_ID,
    patientProfileId: MARIA_ID,
    type: "PARENT",
  });
  await upsertById(prisma.profileRelationship, {
    id: "00000000-0000-4000-8000-000000000202",
    managerProfileId: ANDREI_ID,
    patientProfileId: VLAD_ID,
    type: "PARENT",
  });

  await upsertById(prisma.doctorProfile, {
    id: DOCTOR_PED_ID,
    fullName: "Dr. Ioana Ionescu",
    licenseNumber: "DEMO-MEDIC-001",
    specialty: "Pediatrie",
    isOnline: true,
    pricePerConsultation: 180,
    currency: "RON",
    bio: "Profil de medic din Brașov.",
    isVerified: true,
  });
  await upsertById(prisma.doctorProfile, {
    id: DOCTOR_MF_ID,
    fullName: "Dr. Mihai Dumitrescu",
    licenseNumber: "DEMO-MEDIC-002",
    specialty: "Medicină de familie",
    isOnline: false,
    pricePerConsultation: 150,
    currency: "RON",
    bio: "Profil de medic din Brașov.",
    isVerified: true,
  });

  await upsertById(prisma.triageSession, {
    id: "00000000-0000-4000-8000-000000000401",
    patientProfileId: MARIA_ID,
    startedByProfileId: ANDREI_ID,
    status: "COMPLETED",
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.triageSession, {
    id: "00000000-0000-4000-8000-000000000402",
    patientProfileId: VLAD_ID,
    startedByProfileId: ANDREI_ID,
    status: "ACTIVE",
    createdAt: daysAgo(0, 1),
  });

  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000501",
    sessionId: "00000000-0000-4000-8000-000000000401",
    sender: "PROFILE",
    senderProfileId: ANDREI_ID,
    content: "Maria are o durere ușoară de cap de azi.",
    createdAt: daysAgo(3, 1),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000502",
    sessionId: "00000000-0000-4000-8000-000000000401",
    sender: "AI",
    content:
      "Notați simptomele și contactați un medic dacă sunteți îngrijorați.",
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000503",
    sessionId: "00000000-0000-4000-8000-000000000402",
    sender: "PROFILE",
    senderProfileId: ANDREI_ID,
    content: "Vlad are o întrebare despre alergiile sezoniere.",
    createdAt: daysAgo(0, 1),
  });

  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_MARIA_ID,
    patientProfileId: MARIA_ID,
    recordedByProfileId: ANDREI_ID,
    sourceSessionId: "00000000-0000-4000-8000-000000000401",
    source: "AI_TRIAGE",
    eventType: "OBSERVATION",
    title: "Durere ușoară de cap",
    symptom: "Durere ușoară de cap",
    severity: "LOW",
    summary: "Observație înregistrată după triaj.",
    detail: "Maria a raportat durere ușoară de cap, fără febră.",
    recordedAt: daysAgo(3),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_VLAD_ID,
    patientProfileId: VLAD_ID,
    recordedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_MF_ID,
    source: "DOCTOR",
    eventType: "CONSULTATION",
    title: "Control alergii sezoniere",
    symptom: "Alergii sezoniere",
    severity: "LOW",
    summary: "Consultație pentru alergii sezoniere.",
    detail: "Discuție despre polen și antihistaminic la nevoie.",
    recordedAt: daysAgo(14),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_VLAD_VAX_ID,
    patientProfileId: VLAD_ID,
    recordedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_PED_ID,
    source: "DOCTOR",
    eventType: "VACCINATION",
    title: "Vaccinare sezonieră",
    symptom: "Vaccinare",
    severity: "LOW",
    summary: "Doza sezonieră administrată.",
    detail: "Fără reacții notate după vaccinare.",
    recordedAt: daysAgo(40),
  });

  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000801",
    patientProfileId: MARIA_ID,
    label: "Greutate",
    value: "22",
    unit: "kg",
    recordedAt: daysAgo(20),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000802",
    patientProfileId: MARIA_ID,
    label: "Înălțime",
    value: "118",
    unit: "cm",
    recordedAt: daysAgo(20),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000803",
    patientProfileId: VLAD_ID,
    label: "Greutate",
    value: "38",
    unit: "kg",
    recordedAt: daysAgo(14),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000804",
    patientProfileId: ANDREI_ID,
    label: "Tensiune",
    value: "120/80",
    unit: "mmHg",
    recordedAt: daysAgo(60),
    source: "DECLARED",
  });

  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000901",
    patientProfileId: VLAD_ID,
    timelineEventId: EVENT_VLAD_ID,
    title: "Rezumat control alergii",
    type: "LETTER",
    date: daysAgo(14),
    preview: "Rezumat al consultației pentru alergii sezoniere.",
  });
  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000902",
    patientProfileId: VLAD_ID,
    timelineEventId: EVENT_VLAD_VAX_ID,
    title: "Confirmare vaccinare",
    type: "OTHER",
    date: daysAgo(40),
    preview: "Confirmare a vaccinării sezoniere.",
  });
  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000903",
    patientProfileId: MARIA_ID,
    timelineEventId: EVENT_MARIA_ID,
    title: "Notă observație triaj",
    type: "OTHER",
    date: daysAgo(3),
    preview: "Notă legată de observația după triaj pentru durere de cap.",
  });

  await upsertById(prisma.prescription, {
    id: "00000000-0000-4000-8000-000000000a01",
    patientProfileId: VLAD_ID,
    timelineEventId: EVENT_VLAD_ID,
    title: "Antihistaminic",
    date: daysAgo(14),
    doctorName: "Dr. Mihai Dumitrescu",
    instructions: "La nevoie, conform prospectului, pe perioada polenului.",
  });

  await upsertById(prisma.consultation, {
    id: CONSULT_MARIA_ID,
    patientProfileId: MARIA_ID,
    requestedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_PED_ID,
    triageSessionId: "00000000-0000-4000-8000-000000000401",
    status: "COMPLETED",
    totalFee: 180,
    platformCommission: 27,
    currency: "RON",
    doctorNotes: "Consultație încheiată.",
    startedAt: daysAgo(2, 2),
    endedAt: daysAgo(2, 1),
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.consultation, {
    id: CONSULT_VLAD_ID,
    patientProfileId: VLAD_ID,
    requestedByProfileId: ANDREI_ID,
    triageSessionId: "00000000-0000-4000-8000-000000000402",
    status: "REQUESTED",
    totalFee: 150,
    platformCommission: 22.5,
    currency: "RON",
    createdAt: daysAgo(0, 1),
  });

  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b01",
    consultationId: CONSULT_MARIA_ID,
    sender: "PATIENT",
    content: "Bună ziua, Maria are durere de cap de azi.",
    delivery: "SENT",
    createdAt: daysAgo(3, 2),
  });
  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b02",
    consultationId: CONSULT_MARIA_ID,
    sender: "DOCTOR",
    content: "Am notat. Monitorizați febra și reveniți dacă se agravează.",
    delivery: "SENT",
    createdAt: daysAgo(3, 1),
  });
  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b03",
    consultationId: CONSULT_VLAD_ID,
    sender: "PATIENT",
    content: "Vlad are simptome de alergie sezonieră. Ce putem face?",
    delivery: "PENDING",
    createdAt: daysAgo(0, 1),
  });
}

try {
  await seed();
  console.info("Datele au fost adăugate cu succes.");
} catch (error) {
  console.error("Nu s-au putut adăuga datele:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
