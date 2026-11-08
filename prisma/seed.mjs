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
const TRIAGE_MARIA_ID = "00000000-0000-4000-8000-000000000401";
const TRIAGE_VLAD_ID = "00000000-0000-4000-8000-000000000402";
const EVENT_MARIA_ID = "00000000-0000-4000-8000-000000000601";
const EVENT_VLAD_ID = "00000000-0000-4000-8000-000000000602";
const EVENT_VLAD_VAX_ID = "00000000-0000-4000-8000-000000000603";
const EVENT_ANDREI_ID = "00000000-0000-4000-8000-000000000604";
const EVENT_MARIA_ANALYSIS_ID = "00000000-0000-4000-8000-000000000605";
const EVENT_VLAD_TREATMENT_ID = "00000000-0000-4000-8000-000000000606";
const CONSULT_MARIA_ID = "00000000-0000-4000-8000-000000000701";
const CONSULT_VLAD_ID = "00000000-0000-4000-8000-000000000702";
const CONSULT_ANDREI_ID = "00000000-0000-4000-8000-000000000703";

const daysAgo = (days, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000);

const dateDaysAgo = (days) => {
  const date = daysAgo(days);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/** Zi calendaristică locală de acum `days` zile, ca valoare pentru o coloană `@db.Date`. */
const localDateDaysAgo = (days) => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - days));
};

async function upsertById(delegate, record) {
  const { id, ...data } = record;
  await delegate.upsert({ where: { id }, create: record, update: data });
}

async function seed() {
  await upsertById(prisma.profileSpace, {
    id: SPACE_ID,
    name: "Familia Popescu — Brașov (date demonstrative)",
  });

  await upsertById(prisma.patientProfile, {
    id: ANDREI_ID,
    profileSpaceId: SPACE_ID,
    firstName: "Andrei",
    lastName: "Popescu",
    dateOfBirth: new Date("1988-03-14T00:00:00.000Z"),
    sex: "MALE",
    preferredName: "Andi",
    notes: "Date fictive pentru demonstrație. Preferă notificările în limba română și programările după ora 16:00.",
    allergies: "Nu sunt cunoscute alergii; informație declarată.",
    chronicConditions: "Nicio afecțiune cronică declarată.",
    currentTreatments: "Fără tratament cronic declarat.",
    familyDoctor: "Dr. Mihai Dumitrescu — medic de familie, Brașov",
    insurance: "CNAS — asigurat, medic de familie înscris în județul Brașov",
    attendingDoctors: ["Dr. Mihai Dumitrescu"],
  });
  await upsertById(prisma.patientProfile, {
    id: MARIA_ID,
    profileSpaceId: SPACE_ID,
    firstName: "Maria",
    lastName: "Popescu",
    dateOfBirth: new Date("2016-05-22T00:00:00.000Z"),
    sex: "FEMALE",
    preferredName: "Măriuca",
    notes: "Date fictive pentru demonstrație. Profil administrat de tatăl ei; preferă explicații simple.",
    allergies: "Nu sunt cunoscute alergii; informație declarată de părinte.",
    chronicConditions: "Nicio afecțiune cronică declarată.",
    currentTreatments: "Fără tratament curent declarat.",
    familyDoctor: "Dr. Mihai Dumitrescu — medic de familie, Brașov",
    insurance: "CNAS — copil aflat în întreținerea părintelui",
    attendingDoctors: ["Dr. Ioana Ionescu", "Dr. Mihai Dumitrescu"],
  });
  await upsertById(prisma.patientProfile, {
    id: VLAD_ID,
    profileSpaceId: SPACE_ID,
    firstName: "Vlad",
    lastName: "Popescu",
    dateOfBirth: new Date("2013-09-08T00:00:00.000Z"),
    sex: "MALE",
    preferredName: "Vlad",
    notes: "Date fictive pentru demonstrație. Profil administrat de tatăl lui.",
    allergies: "Polen de graminee; simptome sezoniere declarate de părinte.",
    chronicConditions: "Rinită alergică sezonieră, evaluată de medic.",
    currentTreatments: "Măsuri de evitare a alergenilor; tratamentul se urmează numai conform recomandării medicului.",
    familyDoctor: "Dr. Mihai Dumitrescu — medic de familie, Brașov",
    insurance: "CNAS — copil aflat în întreținerea părintelui",
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
    licenseNumber: "DEMO-BV-PED-001",
    specialty: "Pediatrie",
    isOnline: true,
    pricePerConsultation: 180,
    currency: "RON",
    bio: "Profil fictiv de medic pediatru din Brașov. Consultații online și în cabinet.",
    isVerified: true,
  });
  await upsertById(prisma.doctorProfile, {
    id: DOCTOR_MF_ID,
    fullName: "Dr. Mihai Dumitrescu",
    licenseNumber: "DEMO-BV-MF-002",
    specialty: "Medicină de familie",
    isOnline: false,
    pricePerConsultation: 150,
    currency: "RON",
    bio: "Profil fictiv de medic de familie din Brașov, în relație contractuală demonstrativă cu CAS.",
    isVerified: true,
  });

  await upsertById(prisma.triageSession, {
    id: TRIAGE_MARIA_ID,
    patientProfileId: MARIA_ID,
    startedByProfileId: ANDREI_ID,
    status: "COMPLETED",
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.triageSession, {
    id: TRIAGE_VLAD_ID,
    patientProfileId: VLAD_ID,
    startedByProfileId: ANDREI_ID,
    status: "ACTIVE",
    createdAt: daysAgo(0, 1),
  });

  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000501",
    sessionId: TRIAGE_MARIA_ID,
    sender: "PROFILE",
    senderProfileId: ANDREI_ID,
    content: "Maria acuză o durere ușoară de cap de azi-dimineață. Nu are febră și se simte în rest bine.",
    createdAt: daysAgo(3, 1),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000502",
    sessionId: TRIAGE_MARIA_ID,
    sender: "AI",
    content: "Am înregistrat observația. Urmăriți evoluția și solicitați sfatul medicului dacă simptomele persistă sau se agravează.",
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000503",
    sessionId: TRIAGE_VLAD_ID,
    sender: "PROFILE",
    senderProfileId: ANDREI_ID,
    content: "Vlad strănută și are nasul înfundat după ce a petrecut timp afară. Are alergie sezonieră cunoscută.",
    createdAt: daysAgo(0, 1),
  });
  await upsertById(prisma.triageMessage, {
    id: "00000000-0000-4000-8000-000000000504",
    sessionId: TRIAGE_VLAD_ID,
    sender: "AI",
    content: "Am notat simptomele și istoricul declarat. Pentru recomandări despre tratament, discutați cu medicul care îl urmărește.",
    createdAt: daysAgo(0),
  });

  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_MARIA_ID,
    patientProfileId: MARIA_ID,
    recordedByProfileId: ANDREI_ID,
    sourceSessionId: TRIAGE_MARIA_ID,
    source: "AI_TRIAGE",
    eventType: "OBSERVATION",
    title: "Durere ușoară de cap",
    symptom: "Durere ușoară de cap",
    severity: "LOW",
    summary: "Observație declarată de părinte în timpul triajului.",
    detail: "Debut în dimineața zilei respective; fără febră declarată. Evoluția urmează să fie monitorizată de familie.",
    recordedAt: daysAgo(3),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_VLAD_ID,
    patientProfileId: VLAD_ID,
    recordedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_MF_ID,
    source: "DOCTOR",
    eventType: "CONSULTATION",
    title: "Control pentru alergie sezonieră",
    symptom: "Strănut și nas înfundat sezonier",
    severity: "LOW",
    summary: "Consultație de urmărire pentru simptome sezoniere.",
    detail: "Au fost discutate expunerea la polen, măsurile de evitare a alergenilor și urmărirea simptomelor.",
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
    summary: "Vaccinare înregistrată în carnetul demonstrativ.",
    detail: "Data și produsul trebuie confirmate din documentele medicale reale; această înregistrare este fictivă.",
    recordedAt: daysAgo(40),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_ANDREI_ID,
    patientProfileId: ANDREI_ID,
    recordedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_MF_ID,
    source: "DOCTOR",
    eventType: "CONSULTATION",
    title: "Control periodic",
    symptom: "Control preventiv",
    severity: "LOW",
    summary: "Consultație preventivă fictivă la medicul de familie.",
    detail: "Fără simptome acute declarate; recomandarea generală este continuarea controalelor periodice.",
    recordedAt: daysAgo(60),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_MARIA_ANALYSIS_ID,
    patientProfileId: MARIA_ID,
    recordedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_PED_ID,
    source: "DOCTOR",
    eventType: "ANALYSIS",
    title: "Analize periodice",
    symptom: "Evaluare de rutină",
    severity: "LOW",
    summary: "Înregistrare demonstrativă pentru analize periodice.",
    detail: "Valorile de laborator nu sunt incluse; consultați buletinul de analize real pentru rezultate.",
    recordedAt: daysAgo(90),
  });
  await upsertById(prisma.medicalTimelineEvent, {
    id: EVENT_VLAD_TREATMENT_ID,
    patientProfileId: VLAD_ID,
    recordedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_MF_ID,
    source: "DOCTOR",
    eventType: "TREATMENT_CHANGE",
    title: "Actualizare plan pentru alergie sezonieră",
    symptom: "Alergie sezonieră",
    severity: "LOW",
    summary: "Planul de îngrijire a fost revizuit la control.",
    detail: "Se păstrează măsurile de evitare a alergenilor. Orice tratament medicamentos se administrează doar conform indicațiilor medicului.",
    recordedAt: daysAgo(13),
  });

  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000801",
    patientProfileId: MARIA_ID,
    label: "Greutate",
    value: "31.4",
    unit: "kg",
    recordedAt: daysAgo(20),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000802",
    patientProfileId: MARIA_ID,
    label: "Înălțime",
    value: "134",
    unit: "cm",
    recordedAt: daysAgo(20),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000803",
    patientProfileId: VLAD_ID,
    label: "Greutate",
    value: "45.2",
    unit: "kg",
    recordedAt: daysAgo(14),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000804",
    patientProfileId: ANDREI_ID,
    label: "Tensiune arterială",
    value: "120/80",
    unit: "mmHg",
    recordedAt: daysAgo(60),
    source: "DECLARED",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000805",
    patientProfileId: MARIA_ID,
    label: "Temperatură",
    value: "36.7",
    unit: "°C",
    recordedAt: daysAgo(3),
    source: "DECLARED",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000806",
    patientProfileId: VLAD_ID,
    label: "Înălțime",
    value: "156",
    unit: "cm",
    recordedAt: daysAgo(14),
    source: "CONSULTATION",
  });
  await upsertById(prisma.measurement, {
    id: "00000000-0000-4000-8000-000000000807",
    patientProfileId: ANDREI_ID,
    label: "Greutate",
    value: "78.5",
    unit: "kg",
    recordedAt: daysAgo(60),
    source: "CONSULTATION",
  });

  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000901",
    patientProfileId: VLAD_ID,
    timelineEventId: EVENT_VLAD_ID,
    title: "Scrisoare medicală — control alergologic",
    type: "LETTER",
    date: dateDaysAgo(14),
    preview: "Document demonstrativ: rezumat al consultației și al simptomelor sezoniere declarate.",
  });
  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000902",
    patientProfileId: VLAD_ID,
    timelineEventId: EVENT_VLAD_VAX_ID,
    title: "Adeverință de vaccinare",
    type: "OTHER",
    date: dateDaysAgo(40),
    preview: "Înregistrare fictivă. Confirmați vaccinurile și datele în carnetul de vaccinări real.",
  });
  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000903",
    patientProfileId: MARIA_ID,
    timelineEventId: EVENT_MARIA_ID,
    title: "Notă de observație",
    type: "OTHER",
    date: dateDaysAgo(3),
    preview: "Notă demonstrativă pentru observația de triaj privind durerea ușoară de cap.",
  });
  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000904",
    patientProfileId: MARIA_ID,
    timelineEventId: EVENT_MARIA_ANALYSIS_ID,
    title: "Buletin de analize — exemplu",
    type: "ANALYSIS",
    date: dateDaysAgo(90),
    preview: "Document demonstrativ fără rezultate de laborator. Nu reprezintă un buletin medical real.",
  });
  await upsertById(prisma.medicalDocument, {
    id: "00000000-0000-4000-8000-000000000905",
    patientProfileId: ANDREI_ID,
    timelineEventId: EVENT_ANDREI_ID,
    title: "Rezumat control periodic",
    type: "DISCHARGE",
    date: dateDaysAgo(60),
    preview: "Rezumat fictiv al unei consultații fără internare; datele sunt incluse doar pentru demonstrarea formatului.",
  });

  await upsertById(prisma.prescription, {
    id: "00000000-0000-4000-8000-000000000a01",
    patientProfileId: VLAD_ID,
    timelineEventId: EVENT_VLAD_ID,
    title: "Recomandare pentru alergie sezonieră",
    date: dateDaysAgo(14),
    doctorName: "Dr. Mihai Dumitrescu",
    instructions: "Urmați recomandarea individuală a medicului și prospectul medicamentului prescris. Nu modificați tratamentul fără aviz medical.",
  });
  await upsertById(prisma.prescription, {
    id: "00000000-0000-4000-8000-000000000a02",
    patientProfileId: ANDREI_ID,
    timelineEventId: EVENT_ANDREI_ID,
    title: "Recomandări după control",
    date: dateDaysAgo(60),
    doctorName: "Dr. Mihai Dumitrescu",
    instructions: "Înregistrare demonstrativă de recomandări generale; nu reprezintă o prescripție medicală reală.",
  });

  await upsertById(prisma.consultation, {
    id: CONSULT_MARIA_ID,
    patientProfileId: MARIA_ID,
    requestedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_PED_ID,
    triageSessionId: TRIAGE_MARIA_ID,
    status: "COMPLETED",
    totalFee: 180,
    platformCommission: 27,
    currency: "RON",
    doctorNotes: "Consultație demonstrativă încheiată. Părintele a fost informat să urmărească evoluția simptomelor.",
    startedAt: daysAgo(2, 2),
    endedAt: daysAgo(2, 1),
    createdAt: daysAgo(3),
  });
  await upsertById(prisma.consultation, {
    id: CONSULT_VLAD_ID,
    patientProfileId: VLAD_ID,
    requestedByProfileId: ANDREI_ID,
    triageSessionId: TRIAGE_VLAD_ID,
    status: "REQUESTED",
    totalFee: 150,
    platformCommission: 22.5,
    currency: "RON",
    createdAt: daysAgo(0, 1),
  });
  await upsertById(prisma.consultation, {
    id: CONSULT_ANDREI_ID,
    patientProfileId: ANDREI_ID,
    requestedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_MF_ID,
    status: "ACCEPTED",
    totalFee: 150,
    platformCommission: 22.5,
    currency: "RON",
    doctorNotes: "Programare demonstrativă pentru un control periodic.",
    createdAt: daysAgo(1),
  });

  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b01",
    consultationId: CONSULT_MARIA_ID,
    sender: "PATIENT",
    content: "Bună ziua, Maria a avut o durere ușoară de cap astăzi, fără febră. Putem discuta?",
    delivery: "SENT",
    createdAt: daysAgo(3, 2),
  });
  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b02",
    consultationId: CONSULT_MARIA_ID,
    sender: "DOCTOR",
    content: "Bună ziua. Am notat informațiile și le vom discuta în consultație. Dacă starea se schimbă, luați legătura cu medicul.",
    delivery: "SENT",
    createdAt: daysAgo(3, 1),
  });
  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b03",
    consultationId: CONSULT_VLAD_ID,
    sender: "PATIENT",
    content: "Bună ziua, Vlad are strănut și nas înfundat în perioada cu mult polen. Am dori un sfat pentru urmărirea simptomelor.",
    delivery: "PENDING",
    createdAt: daysAgo(0, 1),
  });
  await upsertById(prisma.consultationMessage, {
    id: "00000000-0000-4000-8000-000000000b04",
    consultationId: CONSULT_ANDREI_ID,
    sender: "DOCTOR",
    content: "Bună ziua, programarea pentru controlul periodic a fost acceptată. Veți primi detaliile consultației în aplicație.",
    delivery: "SENT",
    createdAt: daysAgo(1),
  });

  // Nutriție: intrări demo pentru Maria și Vlad (seria ...0000000002xx, după relațiile 201–202).
  const nutritionEntries = [
    {
      id: "00000000-0000-4000-8000-000000000211",
      patientProfileId: MARIA_ID,
      date: localDateDaysAgo(0),
      mealType: "BREAKFAST",
      description: "Iaurt cu ovăz și banană",
      foodGroups: ["DAIRY", "GRAINS", "FRUITS"],
    },
    {
      id: "00000000-0000-4000-8000-000000000212",
      patientProfileId: MARIA_ID,
      date: localDateDaysAgo(0),
      mealType: "LUNCH",
      description: "Supă de legume, piept de pui la cuptor și orez",
      foodGroups: ["VEGETABLES", "PROTEIN", "GRAINS"],
    },
    {
      id: "00000000-0000-4000-8000-000000000213",
      patientProfileId: MARIA_ID,
      date: localDateDaysAgo(1),
      mealType: "SNACK",
      description: "Biscuiți cu unt de arahide",
      foodGroups: ["GRAINS", "FATS", "SWEETS"],
      hadReaction: true,
      reactionNotes: "Mâncărime în jurul gurii la aproximativ 15 minute după gustare; a trecut în aproximativ o oră.",
      notes: "Prima dată când a mâncat unt de arahide.",
    },
    {
      id: "00000000-0000-4000-8000-000000000214",
      patientProfileId: MARIA_ID,
      date: localDateDaysAgo(1),
      mealType: "DINNER",
      description: "Mămăligă cu brânză și smântână",
      foodGroups: ["GRAINS", "DAIRY"],
    },
    {
      id: "00000000-0000-4000-8000-000000000215",
      patientProfileId: MARIA_ID,
      date: localDateDaysAgo(2),
      mealType: "LUNCH",
      description: "Tocăniță de legume cu mărar și pâine",
      foodGroups: ["VEGETABLES", "GRAINS"],
    },
    {
      id: "00000000-0000-4000-8000-000000000216",
      patientProfileId: VLAD_ID,
      date: localDateDaysAgo(0),
      mealType: "BREAKFAST",
      description: "Omletă cu legume și o felie de pâine integrală",
      foodGroups: ["PROTEIN", "VEGETABLES", "GRAINS"],
    },
    {
      id: "00000000-0000-4000-8000-000000000217",
      patientProfileId: VLAD_ID,
      date: localDateDaysAgo(1),
      mealType: "LUNCH",
      description: "Ciorbă de perișoare și salată de varză",
      foodGroups: ["PROTEIN", "VEGETABLES"],
    },
    {
      id: "00000000-0000-4000-8000-000000000218",
      patientProfileId: VLAD_ID,
      date: localDateDaysAgo(1),
      mealType: "SNACK",
      description: "Măr și o mână de nuci",
      foodGroups: ["FRUITS", "FATS"],
    },
  ];
  for (const entry of nutritionEntries) {
    await upsertById(prisma.nutritionEntry, {
      hadReaction: false,
      reactionNotes: null,
      notes: null,
      ...entry,
    });
  }

  const hydrationLogs = [
    { id: "00000000-0000-4000-8000-000000000221", patientProfileId: MARIA_ID, days: 0, amountMl: 750 },
    { id: "00000000-0000-4000-8000-000000000222", patientProfileId: MARIA_ID, days: 1, amountMl: 1250 },
    { id: "00000000-0000-4000-8000-000000000223", patientProfileId: MARIA_ID, days: 2, amountMl: 1500 },
    { id: "00000000-0000-4000-8000-000000000224", patientProfileId: VLAD_ID, days: 0, amountMl: 1000 },
    { id: "00000000-0000-4000-8000-000000000225", patientProfileId: VLAD_ID, days: 1, amountMl: 1750 },
  ];
  for (const { id, patientProfileId, days, amountMl } of hydrationLogs) {
    const date = localDateDaysAgo(days);
    // Unicitatea e pe (profil, zi). Dacă utilizatorul a înregistrat deja apa pentru acea zi,
    // păstrăm rândul lui și nu suprascriem datele existente.
    const existing = await prisma.hydrationLog.findUnique({
      where: { patientProfileId_date: { patientProfileId, date } },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      continue;
    }
    await upsertById(prisma.hydrationLog, { id, patientProfileId, date, amountMl });
  }
}

try {
  await seed();
  console.info("Datele demonstrative au fost actualizate cu succes.");
} catch (error) {
  console.error("Nu s-au putut actualiza datele demonstrative:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
