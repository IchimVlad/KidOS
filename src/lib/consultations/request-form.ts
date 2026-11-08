import { z } from "zod";

export const CONSULT_REASONS = [
  { id: "fever", label: "Febră" },
  { id: "cough", label: "Tuse / respirație" },
  { id: "digestive", label: "Vărsături / diaree" },
  { id: "rash", label: "Erupție" },
  { id: "pain", label: "Durere" },
  { id: "behavior", label: "Somn / comportament" },
  { id: "other", label: "Altceva" },
] as const;

export type ConsultReasonId = (typeof CONSULT_REASONS)[number]["id"];

export const CONSULT_ALARMS = [
  { id: "breathing", label: "Respiră greu sau buzele par albastre" },
  { id: "lethargy", label: "E foarte somnolent / greu de trezit" },
  { id: "rash_nonblanching", label: "Erupție care nu se albă la apăsare" },
  { id: "no_fluids", label: "Nu bea / vărsături persistente" },
  { id: "infant_fever", label: "Febră la sugar sub 3 luni" },
] as const;

export type ConsultAlarmId = (typeof CONSULT_ALARMS)[number]["id"];

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

export const consultationRequestSchema = z.object({
  reasonId: z.enum([
    "fever",
    "cough",
    "digestive",
    "rash",
    "pain",
    "behavior",
    "other",
  ]),
  alarmIds: z.array(
    z.enum([
      "breathing",
      "lethargy",
      "rash_nonblanching",
      "no_fluids",
      "infant_fever",
    ]),
  ),
  description: z.string().trim().min(10).max(500),
  sinceLabel: z.string().trim().max(80).optional(),
  packageId: z.enum(["chat", "standard", "urgent"]),
});

export type ConsultationRequestInput = z.infer<
  typeof consultationRequestSchema
>;

function labelForReason(id: ConsultReasonId): string {
  return CONSULT_REASONS.find((item) => item.id === id)?.label ?? id;
}

function labelForAlarm(id: ConsultAlarmId): string {
  return CONSULT_ALARMS.find((item) => item.id === id)?.label ?? id;
}

function labelForPackage(id: ConsultPackageId): string {
  const pack = CONSULT_PACKAGES.find((item) => item.id === id);
  return pack ? `${pack.label} (${pack.priceLabel})` : id;
}

export function formatConsultationRequestMessage(
  input: ConsultationRequestInput,
): string {
  const lines = [
    "Solicitare consultație",
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

export function hasCriticalAlarms(alarmIds: ConsultAlarmId[]): boolean {
  return alarmIds.length > 0;
}
