import type { PatientRelation, PatientSex } from "@/lib/patient-select";
import type {
  MedicalDocument,
  PatientDashboard,
  Prescription,
  TimelineEvent,
} from "@/lib/patient-dashboard/types";

const andiDocuments: MedicalDocument[] = [
  {
    id: "doc_andi_hemoleucograma",
    title: "Hemoleucogramă completă",
    type: "analysis",
    date: "2026-10-12",
    eventId: "evt_andi_analize_oct",
    preview:
      "Rezultat demonstrativ: valori în limitele de referință pentru vârstă. Document fictiv, fără valoare medicală.",
  },
  {
    id: "doc_andi_scrisoare",
    title: "Scrisoare medicală — control anual",
    type: "letter",
    date: "2026-09-03",
    eventId: "evt_andi_consult_sept",
    preview:
      "Rezumat demonstrativ al unui control de rutină. Recomandări generale de stil de viață. Nu este un act medical real.",
  },
];

const andiPrescriptions: Prescription[] = [
  {
    id: "rx_andi_vitamina",
    title: "Vitamina D 2000 UI",
    date: "2026-09-03",
    doctorName: "Dr. Ana Ionescu",
    instructions:
      "O capsulă pe zi, dimineața, cu alimente. Instrucțiuni demonstrative.",
    eventId: "evt_andi_consult_sept",
  },
];

const andiEvents: TimelineEvent[] = [
  {
    id: "evt_andi_obs_nov",
    type: "observation",
    date: "2026-11-02",
    title: "Oboseală ușoară după-amiaza",
    summary: "Observație declarată de utilizator, fără consultație asociată.",
    source: "Declarat de utilizator",
    detail:
      "Andi a notat oboseală ușoară după-amiaza, fără febră. Înregistrare demonstrativă.",
    documentIds: [],
    prescriptionIds: [],
    hasAttachment: false,
  },
  {
    id: "evt_andi_analize_oct",
    type: "analysis",
    date: "2026-10-12",
    title: "Set analize de rutină",
    summary: "Hemoleucogramă și profil biochimic de control.",
    source: "Consultație demonstrativă",
    detail:
      "Analize de laborator fictive, legate de un control anual demonstrativ.",
    documentIds: ["doc_andi_hemoleucograma"],
    prescriptionIds: [],
    hasAttachment: true,
  },
  {
    id: "evt_andi_consult_sept",
    type: "consultation",
    date: "2026-09-03",
    title: "Control anual",
    summary: "Consultație demonstrativă cu recomandare de vitamină D.",
    source: "Consultație demonstrativă",
    detail:
      "Control general fictiv. Medicul a discutat stilul de viață și a emis o prescripție demonstrativă.",
    documentIds: ["doc_andi_scrisoare"],
    prescriptionIds: ["rx_andi_vitamina"],
    hasAttachment: true,
  },
  {
    id: "evt_andi_tratament_aug",
    type: "treatment_change",
    date: "2026-08-18",
    title: "Întrerupere temporară antihistaminic",
    summary: "Modificare de tratament înregistrată demonstrativ.",
    source: "Consultație demonstrativă",
    detail:
      "Antihistaminicul sezonier a fost întrerupt după sezonul de polen. Date fictive.",
    documentIds: [],
    prescriptionIds: [],
    hasAttachment: false,
  },
];

const lauraDocuments: MedicalDocument[] = [
  {
    id: "doc_laura_otoscopie",
    title: "Notă consultație ORL",
    type: "letter",
    date: "2026-10-28",
    eventId: "evt_laura_consult_oct",
    preview:
      "Notă demonstrativă: otită medie acută dreaptă, evoluție favorabilă. Nu este un document medical real.",
  },
  {
    id: "doc_laura_vaccin",
    title: "Fișă vaccinare — doza sezonieră",
    type: "other",
    date: "2026-09-15",
    eventId: "evt_laura_vaccin_sept",
    preview:
      "Confirmare demonstrativă a unei vaccinări sezoniere. Fără date administrative reale.",
  },
  {
    id: "doc_laura_externare",
    title: "Bilet de externare — observație scurtă",
    type: "discharge",
    date: "2025-12-04",
    eventId: "evt_laura_externare_dec",
    preview:
      "Externare demonstrativă după observație pentru deshidratare ușoară. Document fictiv.",
  },
];

const lauraPrescriptions: Prescription[] = [
  {
    id: "rx_laura_antibiotic",
    title: "Amoxicilină suspensie",
    date: "2026-10-28",
    doctorName: "Dr. Radu Marinescu",
    instructions:
      "Doza calculată demonstrativ, de 3 ori pe zi, 5 zile. Nu este o indicație medicală reală.",
    eventId: "evt_laura_consult_oct",
  },
  {
    id: "rx_laura_antipiretic",
    title: "Paracetamol sirop",
    date: "2026-10-28",
    doctorName: "Dr. Radu Marinescu",
    instructions:
      "La nevoie, pentru febră, conform greutății. Instrucțiuni demonstrative.",
    eventId: "evt_laura_consult_oct",
  },
];

const lauraEvents: TimelineEvent[] = [
  {
    id: "evt_laura_consult_oct",
    type: "consultation",
    date: "2026-10-28",
    title: "Consultație ORL — otită",
    summary: "Consultație demonstrativă pentru durere de ureche.",
    source: "Consultație demonstrativă",
    detail:
      "Laura a prezentat durere de ureche dreaptă. Plan demonstrativ cu antibiotic și antipiretic.",
    documentIds: ["doc_laura_otoscopie"],
    prescriptionIds: ["rx_laura_antibiotic", "rx_laura_antipiretic"],
    hasAttachment: true,
  },
  {
    id: "evt_laura_obs_oct",
    type: "observation",
    date: "2026-10-26",
    title: "Febră 38,2°C seara",
    summary: "Simptom înregistrat de părinte înainte de consultație.",
    source: "Declarat de utilizator",
    detail:
      "Febră măsurată acasă, fără vărsături. Observație demonstrativă declarată de utilizator.",
    documentIds: [],
    prescriptionIds: [],
    hasAttachment: false,
  },
  {
    id: "evt_laura_vaccin_sept",
    type: "vaccination",
    date: "2026-09-15",
    title: "Vaccinare sezonieră",
    summary: "Doza sezonieră înregistrată demonstrativ.",
    source: "Consultație demonstrativă",
    detail: "Vaccinare fictivă, fără reacții notate în demonstrație.",
    documentIds: ["doc_laura_vaccin"],
    prescriptionIds: [],
    hasAttachment: true,
  },
  {
    id: "evt_laura_analize_mar",
    type: "analysis",
    date: "2026-03-11",
    title: "Analize preșcolare",
    summary: "Set demonstrativ de analize înainte de începerea grădiniței.",
    source: "Consultație demonstrativă",
    detail: "Rezultate fictive, fără anomalii inventate ca diagnostic.",
    documentIds: [],
    prescriptionIds: [],
    hasAttachment: false,
  },
  {
    id: "evt_laura_externare_dec",
    type: "consultation",
    date: "2025-12-04",
    title: "Externare după observație",
    summary: "Episod demonstrativ de deshidratare ușoară.",
    source: "Consultație demonstrativă",
    detail:
      "Observație scurtă în spital, evoluție favorabilă. Date complete fictive.",
    documentIds: ["doc_laura_externare"],
    prescriptionIds: [],
    hasAttachment: true,
  },
];

export const ANDI_DASHBOARD: PatientDashboard = {
  person: {
    id: "profile_andi",
    firstName: "Andi",
    relation: "self",
    sex: "male",
    ageLabel: "34 ani",
    editDetails: {
      preferredName: "Andi",
      notes: "Preferă mesajele scurte. Notă demonstrativă.",
    },
  },
  health: {
    allergies: [
      { text: "Polen de ambrozie", source: "declared" },
      { text: "Penicilină", source: "consultation" },
    ],
    conditions: [{ text: "Rinită alergică sezonieră", source: "consultation" }],
    currentTreatments: [
      { text: "Vitamina D 2000 UI — 1 capsulă/zi", source: "consultation" },
    ],
    measurements: [
      {
        id: "m_andi_ta",
        label: "Tensiune arterială",
        value: "122/78",
        unit: "mmHg",
        recordedAt: "2026-09-03",
        source: "consultation",
      },
      {
        id: "m_andi_puls",
        label: "Puls",
        value: "68",
        unit: "bpm",
        recordedAt: "2026-09-03",
        source: "consultation",
      },
      {
        id: "m_andi_greutate",
        label: "Greutate",
        value: "78",
        unit: "kg",
        recordedAt: "2026-09-03",
        source: "declared",
      },
    ],
  },
  coverage: {
    familyDoctor: "Dr. Elena Pop",
    attendingDoctors: ["Dr. Ana Ionescu"],
    insurance: "CAS — pachet demonstrativ",
  },
  events: andiEvents,
  documents: andiDocuments,
  prescriptions: andiPrescriptions,
  activeConsultation: null,
};

export const LAURA_DASHBOARD: PatientDashboard = {
  person: {
    id: "profile_laura",
    firstName: "Laura",
    relation: "child",
    sex: "female",
    ageLabel: "4 ani",
    editDetails: {
      preferredName: "Laura",
      notes: "Preferă explicații simple. Notă demonstrativă.",
    },
  },
  health: {
    allergies: [{ text: null }],
    conditions: [{ text: "Otite recurente", source: "consultation" }],
    currentTreatments: [
      {
        text: "Amoxicilină suspensie — curs demonstrativ încheiat",
        source: "consultation",
      },
    ],
    measurements: [
      {
        id: "m_laura_greutate",
        label: "Greutate",
        value: "16,4",
        unit: "kg",
        recordedAt: "2026-10-28",
        source: "consultation",
      },
      {
        id: "m_laura_inaltime",
        label: "Înălțime",
        value: "102",
        unit: "cm",
        recordedAt: "2026-10-28",
        source: "consultation",
      },
      {
        id: "m_laura_temp",
        label: "Temperatură",
        value: "36,7",
        unit: "°C",
        recordedAt: "2026-10-28",
        source: "consultation",
      },
    ],
  },
  coverage: {
    familyDoctor: "Dr. Elena Pop",
    attendingDoctors: ["Dr. Radu Marinescu"],
    insurance: null,
  },
  events: lauraEvents,
  documents: lauraDocuments,
  prescriptions: lauraPrescriptions,
  activeConsultation: {
    id: "evt_laura_consult_oct",
    title: "Urmare ORL — otită",
    statusLabel: "În așteptarea unui răspuns demonstrativ",
  },
};

const DASHBOARDS: Record<string, PatientDashboard> = {
  profile_andi: ANDI_DASHBOARD,
  profile_laura: LAURA_DASHBOARD,
};

export function createEmptyDashboard(
  id: string,
  firstName: string,
  relation: PatientRelation,
  sex: PatientSex = "female",
): PatientDashboard {
  const ageLabel =
    relation === "child"
      ? "Vârstă nespecificată"
      : relation === "elder"
        ? "Vârstă nespecificată"
        : "Vârstă nespecificată";

  const measurements =
    relation === "child"
      ? [
          {
            id: `${id}_w`,
            label: "Greutate",
            value: null,
            unit: "kg",
            recordedAt: null,
            source: "declared" as const,
          },
          {
            id: `${id}_h`,
            label: "Înălțime",
            value: null,
            unit: "cm",
            recordedAt: null,
            source: "declared" as const,
          },
        ]
      : relation === "elder"
        ? [
            {
              id: `${id}_bp`,
              label: "Tensiune arterială",
              value: null,
              unit: "mmHg",
              recordedAt: null,
              source: "declared" as const,
            },
            {
              id: `${id}_pulse`,
              label: "Puls",
              value: null,
              unit: "bpm",
              recordedAt: null,
              source: "declared" as const,
            },
          ]
        : [
            {
              id: `${id}_bp`,
              label: "Tensiune arterială",
              value: null,
              unit: "mmHg",
              recordedAt: null,
              source: "declared" as const,
            },
            {
              id: `${id}_weight`,
              label: "Greutate",
              value: null,
              unit: "kg",
              recordedAt: null,
              source: "declared" as const,
            },
          ];

  return {
    person: {
      id,
      firstName,
      relation,
      sex,
      ageLabel,
      editDetails: {
        preferredName: firstName,
        notes: null,
      },
    },
    health: {
      allergies: [{ text: null }],
      conditions: [{ text: null }],
      currentTreatments: [{ text: null }],
      measurements,
    },
    coverage: {
      familyDoctor: null,
      attendingDoctors: [],
      insurance: null,
    },
    events: [],
    documents: [],
    prescriptions: [],
    activeConsultation: null,
  };
}

export function getPatientDashboard(
  profileId: string,
  firstName?: string,
  relation?: PatientRelation,
  sex?: PatientSex,
): PatientDashboard {
  const existing = DASHBOARDS[profileId];
  if (existing) {
    return existing;
  }

  return createEmptyDashboard(
    profileId,
    firstName ?? "Persoană",
    relation ?? "self",
    sex ?? "female",
  );
}
