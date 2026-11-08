import { z } from "zod";

export type ConsultCohort = "child" | "adult" | "elder";

export function consultCohortFromAge(ageYears: number): ConsultCohort {
  if (ageYears < 18) {
    return "child";
  }
  if (ageYears >= 65) {
    return "elder";
  }
  return "adult";
}

export const CONSULT_REASONS_BY_COHORT = {
  child: [
    { id: "fever", label: "Febră" },
    { id: "cough", label: "Tuse / respirație" },
    { id: "digestive", label: "Vărsături / diaree" },
    { id: "rash", label: "Erupție" },
    { id: "pain", label: "Durere" },
    { id: "behavior", label: "Somn / comportament" },
    { id: "other", label: "Altceva" },
  ],
  adult: [
    { id: "fever", label: "Febră" },
    { id: "cough", label: "Tuse / respirație" },
    { id: "digestive", label: "Digestiv" },
    { id: "pain", label: "Durere" },
    { id: "skin", label: "Piele / erupție" },
    { id: "fatigue", label: "Oboseală / somn" },
    { id: "chronic", label: "Acutizare cronică" },
    { id: "other", label: "Altceva" },
  ],
  elder: [
    { id: "fever", label: "Febră" },
    { id: "breathing_issue", label: "Respirație" },
    { id: "dizziness", label: "Amețeală / cădere" },
    { id: "confusion", label: "Confuzie / stare alterată" },
    { id: "pain", label: "Durere" },
    { id: "medication", label: "Medicație / efecte" },
    { id: "chronic", label: "Acutizare cronică" },
    { id: "other", label: "Altceva" },
  ],
} as const;

export const CONSULT_ALARMS_BY_COHORT = {
  child: [
    { id: "breathing", label: "Respiră greu sau buzele par albastre" },
    { id: "lethargy", label: "E foarte somnolent / greu de trezit" },
    { id: "rash_nonblanching", label: "Erupție care nu se albă la apăsare" },
    { id: "no_fluids", label: "Nu bea / vărsături persistente" },
    { id: "infant_fever", label: "Febră la sugar sub 3 luni" },
  ],
  adult: [
    { id: "chest_pain", label: "Durere sau apăsare în piept" },
    { id: "severe_breathing", label: "Dispnee severă / nu poate vorbi în propoziții" },
    { id: "neuro_symptoms", label: "Slăbiciune bruscă, vorbire alterată sau asimetrie facială" },
    { id: "severe_bleeding", label: "Sângerare abundentă care nu se oprește" },
    { id: "sudden_severe_headache", label: "Cefalee bruscă, cea mai intensă din viață" },
  ],
  elder: [
    { id: "chest_pain", label: "Durere sau apăsare în piept" },
    { id: "stroke_signs", label: "Semne de accident vascular (față, braț, vorbire)" },
    { id: "fall_injury", label: "Cădere cu lovitură la cap sau imposibilitate de a se ridica" },
    { id: "cant_meds_fluids", label: "Nu poate lua medicamente / lichide" },
    { id: "severe_breathing", label: "Dispnee severă sau confuzie nouă legată de respirație" },
  ],
} as const;

export type ConsultReasonId =
  (typeof CONSULT_REASONS_BY_COHORT)[ConsultCohort][number]["id"];

export type ConsultAlarmId =
  (typeof CONSULT_ALARMS_BY_COHORT)[ConsultCohort][number]["id"];

/** @deprecated Use CONSULT_REASONS_BY_COHORT.child — kept for any leftover imports */
export const CONSULT_REASONS = CONSULT_REASONS_BY_COHORT.child;
/** @deprecated Use CONSULT_ALARMS_BY_COHORT.child */
export const CONSULT_ALARMS = CONSULT_ALARMS_BY_COHORT.child;

export const CONSULT_PACKAGES = [
  {
    id: "chat",
    label: "Chat medical",
    priceLabel: "120 RON",
    detail: "Răspuns în chat, de obicei în câteva ore.",
  },
  {
    id: "standard",
    label: "Consultație standard",
    priceLabel: "180 RON",
    detail: "Chat prioritar în aceeași zi lucrătoare.",
  },
  {
    id: "urgent",
    label: "Prioritar",
    priceLabel: "250 RON",
    detail: "Răspuns cât mai rapid, în afara programului standard.",
  },
] as const;

export type ConsultPackageId = (typeof CONSULT_PACKAGES)[number]["id"];

const ALL_REASON_IDS = [
  "fever",
  "cough",
  "digestive",
  "rash",
  "pain",
  "behavior",
  "skin",
  "fatigue",
  "chronic",
  "breathing_issue",
  "dizziness",
  "confusion",
  "medication",
  "other",
] as const;

const ALL_ALARM_IDS = [
  "breathing",
  "lethargy",
  "rash_nonblanching",
  "no_fluids",
  "infant_fever",
  "chest_pain",
  "severe_breathing",
  "neuro_symptoms",
  "severe_bleeding",
  "sudden_severe_headache",
  "stroke_signs",
  "fall_injury",
  "cant_meds_fluids",
] as const;

export const consultationRequestSchema = z.object({
  cohort: z.enum(["child", "adult", "elder"]),
  reasonId: z.enum(ALL_REASON_IDS),
  alarmIds: z.array(z.enum(ALL_ALARM_IDS)),
  description: z.string().trim().min(10).max(500),
  sinceLabel: z.string().trim().max(80).optional(),
  packageId: z.enum(["chat", "standard", "urgent"]),
});

export type ConsultationRequestInput = z.infer<
  typeof consultationRequestSchema
>;

export function reasonsForCohort(cohort: ConsultCohort) {
  return CONSULT_REASONS_BY_COHORT[cohort];
}

export function alarmsForCohort(cohort: ConsultCohort) {
  return CONSULT_ALARMS_BY_COHORT[cohort];
}

function labelForReason(id: string): string {
  for (const cohort of Object.values(CONSULT_REASONS_BY_COHORT)) {
    const match = cohort.find((item) => item.id === id);
    if (match) {
      return match.label;
    }
  }
  return id;
}

function labelForAlarm(id: string): string {
  for (const cohort of Object.values(CONSULT_ALARMS_BY_COHORT)) {
    const match = cohort.find((item) => item.id === id);
    if (match) {
      return match.label;
    }
  }
  return id;
}

function labelForPackage(id: ConsultPackageId): string {
  const pack = CONSULT_PACKAGES.find((item) => item.id === id);
  return pack ? `${pack.label} (${pack.priceLabel})` : id;
}

function cohortLabel(cohort: ConsultCohort): string {
  if (cohort === "child") {
    return "copil";
  }
  if (cohort === "elder") {
    return "vârstnic";
  }
  return "adult";
}

export function formatConsultationRequestMessage(
  input: ConsultationRequestInput,
): string {
  const lines = [
    "Solicitare consultație",
    `Profil: ${cohortLabel(input.cohort)}`,
    `Motiv: ${labelForReason(input.reasonId)}`,
  ];

  if (input.sinceLabel && input.sinceLabel.length > 0) {
    lines.push(`De când: ${input.sinceLabel}`);
  }

  if (input.alarmIds.length > 0) {
    lines.push(
      `Semne bifate: ${input.alarmIds.map(labelForAlarm).join("; ")}`,
    );
  } else {
    lines.push("Semne de alarmă: niciunul bifat");
  }

  lines.push(`Descriere: ${input.description}`);
  lines.push(`Pachet: ${labelForPackage(input.packageId)}`);

  return lines.join("\n");
}

export function hasCriticalAlarms(alarmIds: readonly string[]): boolean {
  return alarmIds.length > 0;
}
