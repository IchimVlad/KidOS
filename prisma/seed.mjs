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
    notes:
      "Date fictive pentru demonstrație. Profil administrat de tatăl ei; preferă explicații simple. " +
      "Elevă în clasa a IV-a; înot de 2 ori pe săptămână. Poartă ochelari doar pentru citit din 2025 (hipermetropie ușoară).",
    allergies:
      "Fără alergii medicamentoase cunoscute. Suspiciune de alergie la arahide: mâncărime periorală după unt de arahide, " +
      "notată în jurnalul alimentar — în evaluare, se evită arahidele până la avizul alergologului.",
    chronicConditions:
      "Fără afecțiuni cronice active. Dermatită atopică în primii ani de viață, în remisie din 2019. " +
      "Insuficiență de vitamina D (22 ng/mL) la analizele din vară, în corectare.",
    currentTreatments:
      "Vitamina D3 1000 UI/zi, 3 luni (recomandare Dr. Ioana Ionescu), apoi recontrol 25-OH vitamina D. " +
      "Ochelari pentru citit (+1,00 D ODS).",
    familyDoctor: "Dr. Mihai Dumitrescu — medic de familie, Brașov",
    insurance: "CNAS — copil aflat în întreținerea părintelui",
    attendingDoctors: ["Dr. Ioana Ionescu", "Dr. Mihai Dumitrescu"],
    bloodType: "A II, Rh pozitiv",
    pastSurgeries:
      "Adenoidectomie sub anestezie generală — octombrie 2021, Spitalul Clinic de Urgență pentru Copii Brașov " +
      "(vegetații adenoide obstructive, otite repetate). Evoluție postoperatorie fără complicații.",
    vaccinationStatus:
      "Schema din Programul Național de Vaccinare completă pentru vârstă: BCG și Hep B la naștere; hexavalent și " +
      "pneumococic la 2, 4 și 11 luni; ROR la 12 luni și 5 ani; DTPa-VPI la 6 ani. Vaccin gripal sezonier efectuat " +
      "în octombrie 2026. Urmează: HPV (eligibilă de la 11 ani, mai 2027) și dTpa la 14 ani.",
    emergencyContactName: "Andrei Popescu (tată)",
    emergencyContactPhone: "0740 512 384",
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
    title: "Analize periodice — hemoleucogramă, feritină, vitamina D",
    symptom: "Evaluare de rutină",
    severity: "LOW",
    summary: "Analize de rutină: valori normale, cu excepția vitaminei D (insuficiență).",
    detail:
      "Hemoglobină 12,8 g/dL; leucocite 6.900/µL; trombocite 284.000/µL; feritină 31 ng/mL; glicemie à jeun 84 mg/dL; " +
      "TSH 2,1 µUI/mL; 25-OH vitamina D 22 ng/mL (insuficiență: 20–29 ng/mL). Recomandare: suplimentare cu vitamina D3 " +
      "și recontrol după 3 luni.",
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
    title: "Buletin de analize — hemoleucogramă, biochimie, vitamina D",
    type: "ANALYSIS",
    date: dateDaysAgo(90),
    preview:
      "Laborator demonstrativ Brașov. Hb 12,8 g/dL (11,5–15,5); Ht 38,1%; leucocite 6,9 ×10³/µL (4,5–13,5); " +
      "trombocite 284 ×10³/µL; feritină 31 ng/mL (15–150); glicemie 84 mg/dL (70–100); TSH 2,1 µUI/mL (0,7–5,9); " +
      "25-OH vitamina D 22 ng/mL — sub intervalul optim (30–100). Document fictiv.",
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
    doctorNotes:
      "Cefalee frontală bilaterală, ușoară, apărută după-amiaza, fără febră, vărsături, tulburări de vedere sau redoare de ceafă. " +
      "Examen neurologic declarat normal. Aport de lichide redus (sub 1 L/zi) și ~3 ore de ecran pe zi. " +
      "Impresie: cefalee de tip tensional, probabil favorizată de hidratare insuficientă. Recomandări: 1,5 L lichide/zi, " +
      "pauze de la ecran la 30 de minute, somn 9–10 ore, jurnal al durerilor de cap 2 săptămâni; control oftalmologic dacă persistă. " +
      "Semne de alarmă explicate părintelui (febră, vărsături, cefalee care trezește copilul din somn).",
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

  await seedMariaHistory();

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

/**
 * Istoric medical demonstrativ, coerent, pentru Maria („Măriuca”, n. 22.05.2016).
 * Toate datele sunt fictive. Seria de ID-uri ...00000000c0xx–c8xx.
 */
async function seedMariaHistory() {
  const id = (suffix) => `00000000-0000-4000-8000-00000000${suffix}`;
  const EV = {
    ror2: id("c001"),
    dtpa: id("c002"),
    adeno: id("c003"),
    ophtho: id("c004"),
    otitis: id("c005"),
    vitD: id("c006"),
    checkup: id("c007"),
    flu: id("c008"),
    teleconsult: id("c009"),
    peanut: id("c010"),
  };
  const CONSULT_MARIA_LABS_ID = id("c401");

  const events = [
    {
      id: EV.ror2,
      doctorProfileId: DOCTOR_MF_ID,
      source: "DOCTOR",
      eventType: "VACCINATION",
      title: "Vaccin ROR — doza a 2-a",
      symptom: "Vaccinare conform PNV",
      severity: "LOW",
      summary: "Rujeolă–oreion–rubeolă, doza a 2-a, la vârsta de 5 ani.",
      detail: "Administrat intramuscular, braț stâng, la cabinetul medicului de familie. Fără reacții adverse în cele 30 de minute de supraveghere; subfebrilitate 37,6 °C în ziua 8, remisă spontan.",
      recordedAt: new Date("2021-06-08T09:30:00.000Z"),
    },
    {
      id: EV.adeno,
      doctorProfileId: null,
      source: "DOCTOR",
      eventType: "TREATMENT_CHANGE",
      title: "Adenoidectomie",
      symptom: "Vegetații adenoide obstructive, otite repetate",
      severity: "MEDIUM",
      summary: "Intervenție chirurgicală ORL programată, fără complicații.",
      detail: "Indicație: respirație orală, sforăit nocturn și 4 episoade de otită medie acută în 12 luni. Adenoidectomie sub anestezie generală, internare 2 zile. Externată afebrilă, cu recomandare de dietă semilichidă rece 5 zile și control ORL la 2 săptămâni (normal).",
      recordedAt: new Date("2021-10-14T08:00:00.000Z"),
    },
    {
      id: EV.dtpa,
      doctorProfileId: DOCTOR_MF_ID,
      source: "DOCTOR",
      eventType: "VACCINATION",
      title: "Vaccin DTPa-VPI (rapel 6 ani)",
      symptom: "Vaccinare conform PNV",
      severity: "LOW",
      summary: "Rapel difteric, tetanic, pertussis acelular și poliomielitic.",
      detail: "Administrat intramuscular, deltoid drept. Reacție locală ușoară (roșeață 2 cm, sensibilitate) 48 de ore, fără febră.",
      recordedAt: new Date("2022-06-15T10:00:00.000Z"),
    },
    {
      id: EV.ophtho,
      doctorProfileId: null,
      source: "DOCTOR",
      eventType: "CONSULTATION",
      title: "Consult oftalmologic",
      symptom: "Oboseală oculară la citit",
      severity: "LOW",
      summary: "Hipermetropie ușoară; ochelari pentru citit.",
      detail: "AV fără corecție 1/1 ODS la distanță. Refracție sub cicloplegie: +1,00 D ODS. Fără strabism, fund de ochi normal. Ochelari pentru activități de aproape; control anual.",
      recordedAt: daysAgo(400),
    },
    {
      id: EV.otitis,
      doctorProfileId: DOCTOR_MF_ID,
      source: "DOCTOR",
      eventType: "CONSULTATION",
      title: "Otită medie acută, ureche dreaptă",
      symptom: "Otalgie dreaptă și febră 38,6 °C",
      severity: "MEDIUM",
      summary: "Otită medie acută după o răceală; tratament antibiotic 7 zile.",
      detail: "Debut cu rinoree 3 zile, apoi otalgie dreaptă și febră 38,6 °C. Otoscopie: timpan drept congestiv, bombat; stâng normal. Tratament cu amoxicilină și antitermic la nevoie. Control la 10 zile: timpan normal, auz subiectiv normal.",
      recordedAt: daysAgo(265),
    },
    {
      id: EV.vitD,
      doctorProfileId: DOCTOR_PED_ID,
      source: "DOCTOR",
      eventType: "TREATMENT_CHANGE",
      title: "Inițiere vitamina D3",
      symptom: "Insuficiență de vitamina D",
      severity: "LOW",
      summary: "Vitamina D3 1000 UI/zi, 3 luni, după analizele periodice.",
      detail: "25-OH vitamina D 22 ng/mL. S-a recomandat vitamina D3 1000 UI/zi, administrată la masa principală, 3 luni, plus activitate în aer liber. Recontrol 25-OH vitamina D programat după încheierea curei.",
      recordedAt: daysAgo(88),
    },
    {
      id: EV.checkup,
      doctorProfileId: DOCTOR_PED_ID,
      source: "DOCTOR",
      eventType: "CONSULTATION",
      title: "Control pediatric periodic — 10 ani",
      symptom: "Bilanț de sănătate",
      severity: "LOW",
      summary: "Creștere și dezvoltare normale; IMC în limite normale.",
      detail: "Înălțime 134 cm (≈ P25), greutate 31,4 kg (≈ P45), IMC 17,5 kg/m² (≈ P65, normoponderal). Viteză de creștere 5,4 cm/an. TA 102/64 mmHg, AV 84/min. Examen clinic normal, dentiție mixtă îngrijită, stadiu pubertar Tanner I. Discutat despre vaccinarea HPV de la 11 ani.",
      recordedAt: daysAgo(20),
    },
    {
      id: EV.flu,
      doctorProfileId: DOCTOR_MF_ID,
      source: "DOCTOR",
      eventType: "VACCINATION",
      title: "Vaccin gripal sezonier 2026–2027",
      symptom: "Vaccinare sezonieră",
      severity: "LOW",
      summary: "Vaccin gripal inactivat, o doză.",
      detail: "Administrat intramuscular, deltoid stâng. Fără reacții adverse raportate de părinte la 48 de ore.",
      recordedAt: daysAgo(25),
    },
    {
      id: EV.teleconsult,
      doctorProfileId: DOCTOR_PED_ID,
      source: "DOCTOR",
      eventType: "CONSULTATION",
      title: "Teleconsultație pediatrică — cefalee",
      symptom: "Cefalee ușoară",
      severity: "LOW",
      summary: "Cefalee de tip tensional, probabil legată de hidratare insuficientă și timp lung la ecran.",
      detail: "Fără semne de alarmă. Recomandări: 1,5 L lichide/zi, pauze de la ecran, somn regulat, jurnal al durerilor de cap 2 săptămâni. Control oftalmologic dacă simptomele persistă.",
      recordedAt: daysAgo(2, 1),
    },
    {
      id: EV.peanut,
      doctorProfileId: null,
      source: "PROFILE",
      eventType: "OBSERVATION",
      title: "Mâncărime periorală după unt de arahide",
      symptom: "Prurit perioral",
      severity: "MEDIUM",
      summary: "Reacție ușoară, localizată, la prima expunere la arahide; a trecut în ~1 oră.",
      detail: "La ~15 minute după biscuiți cu unt de arahide: mâncărime în jurul gurii și câteva pete roșii pe bărbie. Fără umflarea buzelor, dificultăți de respirație, vărsături sau urticarie generalizată. Nu a primit medicație. Familia evită arahidele până la evaluarea alergologică.",
      recordedAt: daysAgo(1),
    },
  ];
  for (const event of events) {
    await upsertById(prisma.medicalTimelineEvent, {
      patientProfileId: MARIA_ID,
      recordedByProfileId: ANDREI_ID,
      sourceSessionId: null,
      ...event,
    });
  }

  const measurements = [
    ["c101", "Greutate", "25.0", "kg", daysAgo(750), "CONSULTATION"],
    ["c102", "Înălțime", "122.9", "cm", daysAgo(750), "CONSULTATION"],
    ["c103", "Greutate", "28.1", "kg", daysAgo(385), "CONSULTATION"],
    ["c104", "Înălțime", "128.6", "cm", daysAgo(385), "CONSULTATION"],
    ["c105", "Temperatură", "38.6", "°C", daysAgo(265), "DECLARED"],
    ["c106", "IMC", "17.5", "kg/m²", daysAgo(20), "CONSULTATION"],
    ["c107", "Tensiune arterială", "102/64", "mmHg", daysAgo(20), "CONSULTATION"],
    ["c108", "Puls", "84", "bpm", daysAgo(20), "CONSULTATION"],
  ];
  for (const [suffix, label, value, unit, recordedAt, source] of measurements) {
    await upsertById(prisma.measurement, {
      id: id(suffix),
      patientProfileId: MARIA_ID,
      label,
      value,
      unit,
      recordedAt,
      source,
    });
  }

  const documents = [
    {
      id: id("c201"),
      timelineEventId: EV.adeno,
      title: "Bilet de externare — adenoidectomie",
      type: "DISCHARGE",
      date: new Date("2021-10-15T00:00:00.000Z"),
      preview: "Spitalul Clinic de Urgență pentru Copii Brașov, secția ORL (date fictive). Diagnostic: vegetații adenoide hipertrofice obstructive; otită medie acută recurentă. Intervenție: adenoidectomie sub anestezie generală, 14.10.2021. Evoluție favorabilă, afebrilă. Recomandări: alimentație semilichidă rece 5 zile, evitarea efortului 7 zile, control ORL la 14 zile.",
    },
    {
      id: id("c202"),
      timelineEventId: EV.ophtho,
      title: "Scrisoare medicală — consult oftalmologic",
      type: "LETTER",
      date: dateDaysAgo(400),
      preview: "AV fără corecție 1/1 ODS. Refracție cicloplegică: OD +1,00 D, OS +1,00 D. Motilitate oculară normală, fără strabism. Pol posterior normal. Concluzie: hipermetropie ușoară. Ochelari pentru aproape, control peste 12 luni.",
    },
    {
      id: id("c203"),
      timelineEventId: EV.checkup,
      title: "Fișă de bilanț — control pediatric 10 ani",
      type: "OTHER",
      date: dateDaysAgo(20),
      preview: "G 31,4 kg · Î 134 cm · IMC 17,5 kg/m² (P65) · TA 102/64 mmHg · AV 84/min. Dezvoltare psihomotorie și școlară adecvată vârstei. Vaccinări la zi conform PNV. Recomandări: activitate fizică 60 min/zi, max. 2 ore ecran/zi, continuarea vitaminei D3 până la recontrol.",
    },
    {
      id: id("c204"),
      timelineEventId: EV.flu,
      title: "Adeverință de vaccinare — gripal 2026–2027",
      type: "OTHER",
      date: dateDaysAgo(25),
      preview: "Vaccin gripal inactivat, 0,5 mL i.m., deltoid stâng. Lot demonstrativ DEMO-FLU-2627. Fără reacții adverse imediate. Document fictiv.",
    },
    {
      id: id("c205"),
      timelineEventId: EV.teleconsult,
      title: "Scrisoare medicală — teleconsultație cefalee",
      type: "LETTER",
      date: dateDaysAgo(2),
      preview: "Motivul consultației: cefalee frontală ușoară, fără febră. Diagnostic de lucru: cefalee de tip tensional. Recomandări: hidratare 1,5 L/zi, igiena somnului, limitarea timpului la ecran, jurnal al cefaleei. Reevaluare dacă apar vărsături, febră, tulburări de vedere sau dacă durerea trezește copilul din somn.",
    },
  ];
  for (const document of documents) {
    await upsertById(prisma.medicalDocument, { patientProfileId: MARIA_ID, ...document });
  }

  const prescriptions = [
    {
      id: id("c301"),
      timelineEventId: EV.otitis,
      title: "Tratament otită medie acută",
      date: dateDaysAgo(265),
      doctorName: "Dr. Mihai Dumitrescu",
      instructions: "Amoxicilină 1000 mg — 1 comprimat la 12 ore, 7 zile, după masă; tratamentul se face complet, chiar dacă simptomele dispar. Paracetamol sirop 250 mg/5 mL — 8 mL (400 mg) la nevoie pentru febră sau durere, la minimum 6 ore, maximum 4 doze/zi. Control la 10 zile.",
    },
    {
      id: id("c302"),
      timelineEventId: EV.vitD,
      title: "Vitamina D3 — cură 3 luni",
      date: dateDaysAgo(88),
      doctorName: "Dr. Ioana Ionescu",
      instructions: "Vitamina D3 1000 UI — 1 doză pe zi, la masa principală, timp de 3 luni. Recontrol 25-OH vitamina D la finalul curei. Nu se asociază alte suplimente cu vitamina D fără aviz medical.",
    },
    {
      id: id("c303"),
      timelineEventId: EV.ophtho,
      title: "Prescripție ochelari",
      date: dateDaysAgo(400),
      doctorName: "Dr. Elena Marin (oftalmologie)",
      instructions: "Lentile sferice OD +1,00 D, OS +1,00 D, DIP 58 mm. Purtare la citit, scris și ecrane. Control oftalmologic anual.",
    },
  ];
  for (const prescription of prescriptions) {
    await upsertById(prisma.prescription, { patientProfileId: MARIA_ID, ...prescription });
  }

  await upsertById(prisma.consultation, {
    id: CONSULT_MARIA_LABS_ID,
    patientProfileId: MARIA_ID,
    requestedByProfileId: ANDREI_ID,
    doctorProfileId: DOCTOR_PED_ID,
    triageSessionId: null,
    status: "COMPLETED",
    totalFee: 180,
    platformCommission: 27,
    currency: "RON",
    doctorNotes:
      "Interpretare analize periodice: hemoleucogramă, feritină, glicemie și TSH în limite normale. " +
      "25-OH vitamina D 22 ng/mL — insuficiență. Inițiat vitamina D3 1000 UI/zi, 3 luni; recontrol la final. " +
      "Recomandat 30–60 min/zi activitate în aer liber și consum de pește de 2 ori pe săptămână.",
    startedAt: daysAgo(88, 3),
    endedAt: daysAgo(88, 2.5),
    createdAt: daysAgo(89),
  });
  const consultMessages = [
    ["c501", "PATIENT", "Bună ziua, am primit rezultatele analizelor Măriucăi. Vitamina D apare cu 22 ng/mL, sub interval. Ce ar trebui să facem?", daysAgo(89)],
    ["c502", "DOCTOR", "Bună ziua. Am văzut buletinul: restul valorilor sunt normale. 22 ng/mL înseamnă insuficiență ușoară, nu carență. Discutăm mâine în consultație planul de suplimentare.", daysAgo(89, -3)],
    ["c503", "DOCTOR", "Conform discuției: vitamina D3 1000 UI pe zi, la masa de prânz, 3 luni. Vă rog să refaceți 25-OH vitamina D după încheierea curei.", daysAgo(88, 2.5)],
    ["c504", "PATIENT", "Mulțumim, am înțeles. Revenim cu rezultatele.", daysAgo(88, 2)],
  ];
  for (const [suffix, sender, content, createdAt] of consultMessages) {
    await upsertById(prisma.consultationMessage, {
      id: id(suffix),
      consultationId: CONSULT_MARIA_LABS_ID,
      sender,
      content,
      delivery: "SENT",
      createdAt,
    });
  }

  const triageMessages = [
    ["c801", "AI", null, "Înțeleg. Ca să notez corect: are febră, vărsături, sensibilitate la lumină sau a suferit vreo lovitură la cap recent?", daysAgo(3, 0.8)],
    ["c802", "PROFILE", ANDREI_ID, "Nu are nimic din acestea. A stat cam 3 ore pe tabletă ieri și a băut puțină apă, cred că sub un litru.", daysAgo(3, 0.6)],
    ["c803", "AI", null, "Mulțumesc. Am notat: durere ușoară, fără febră sau alte semne de alarmă, hidratare redusă și timp lung la ecran. Puteți solicita o consultație cu medicul pediatru pentru o evaluare.", daysAgo(3, 0.4)],
  ];
  for (const [suffix, sender, senderProfileId, content, createdAt] of triageMessages) {
    await upsertById(prisma.triageMessage, {
      id: id(suffix),
      sessionId: TRIAGE_MARIA_ID,
      sender,
      senderProfileId,
      content,
      createdAt,
    });
  }

  const nutrition = [
    [2, "BREAKFAST", "Lapte cu cereale integrale și o pară", ["DAIRY", "GRAINS", "FRUITS"]],
    [2, "DINNER", "Paste cu sos de roșii și ton, salată de castraveți", ["GRAINS", "PROTEIN", "VEGETABLES"]],
    [3, "BREAKFAST", "Pâine prăjită cu unt și ou fiert", ["GRAINS", "FATS", "PROTEIN"]],
    [3, "LUNCH", "Ciorbă de legume și chiftele de pui cu piure", ["VEGETABLES", "PROTEIN"], "A mâncat puțin; s-a plâns de durere de cap după-amiază."],
    [3, "SNACK", "Napolitane și suc de portocale", ["SWEETS", "FRUITS"]],
    [4, "BREAKFAST", "Iaurt grecesc cu miere și nuci", ["DAIRY", "FATS", "SWEETS"]],
    [4, "LUNCH", "Pește la cuptor (somon) cu cartofi natur și broccoli", ["PROTEIN", "GRAINS", "VEGETABLES"]],
    [4, "DINNER", "Sandviș cu brânză telemea și roșii", ["GRAINS", "DAIRY", "VEGETABLES"]],
    [5, "BREAKFAST", "Clătite cu brânză dulce", ["GRAINS", "DAIRY", "SWEETS"]],
    [5, "LUNCH", "Fasole verde cu pui și pâine", ["VEGETABLES", "PROTEIN", "GRAINS"]],
    [5, "SNACK", "Morcov crud și hummus", ["VEGETABLES", "PROTEIN"], "Gustare la școală."],
    [6, "LUNCH", "Sarmale cu smântână și mămăligă", ["PROTEIN", "GRAINS", "DAIRY"], "Masă la bunici, duminică."],
    [6, "DINNER", "Supă cremă de dovleac cu crutoane", ["VEGETABLES", "GRAINS"]],
  ];
  for (const [index, [days, mealType, description, foodGroups, notes = null]] of nutrition.entries()) {
    await upsertById(prisma.nutritionEntry, {
      id: id(`c6${String(index + 1).padStart(2, "0")}`),
      patientProfileId: MARIA_ID,
      date: localDateDaysAgo(days),
      mealType,
      description,
      foodGroups,
      hadReaction: false,
      reactionNotes: null,
      notes,
    });
  }

  const hydration = [
    ["c701", 3, 800],
    ["c702", 4, 1300],
    ["c703", 5, 1400],
    ["c704", 6, 1100],
  ];
  for (const [suffix, days, amountMl] of hydration) {
    const date = localDateDaysAgo(days);
    const existing = await prisma.hydrationLog.findUnique({
      where: { patientProfileId_date: { patientProfileId: MARIA_ID, date } },
      select: { id: true },
    });
    if (existing && existing.id !== id(suffix)) {
      continue;
    }
    await upsertById(prisma.hydrationLog, { id: id(suffix), patientProfileId: MARIA_ID, date, amountMl });
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
