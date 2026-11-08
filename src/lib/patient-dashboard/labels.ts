import type {
  DocumentType,
  InfoSource,
  TimelineEventType,
  TimelineFilter,
} from "@/lib/patient-dashboard/types";

export const EVENT_TYPE_LABEL: Record<TimelineEventType, string> = {
  consultation: "Consultație",
  observation: "Observație",
  analysis: "Analiză",
  vaccination: "Vaccinare",
  treatment_change: "Modificare tratament",
  profile_update: "Profil actualizat",
};

export const TIMELINE_FILTERS: { id: TimelineFilter; label: string }[] = [
  { id: "all", label: "Toate" },
  { id: "consultation", label: "Consultații" },
  { id: "analysis", label: "Analize" },
  { id: "treatment", label: "Tratamente" },
  { id: "observation", label: "Observații" },
  { id: "profile", label: "Profil" },
];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  analysis: "Analiză",
  letter: "Scrisoare medicală",
  discharge: "Bilet de externare",
  other: "Alt act medical",
};

export const DOCUMENT_FILTERS: { id: DocumentType | "all"; label: string }[] = [
  { id: "all", label: "Toate" },
  { id: "analysis", label: "Analize" },
  { id: "letter", label: "Scrisori" },
  { id: "discharge", label: "Externări" },
  { id: "other", label: "Altele" },
];

export function sourceLabel(source: InfoSource | undefined): string | null {
  if (source === "declared") {
    return "Declarat de utilizator";
  }
  if (source === "consultation") {
    return "Din consultație";
  }
  return null;
}

export function displayValue(text: string | null | undefined): string {
  if (text == null || text.trim().length === 0) {
    return "Nespecificat";
  }
  return text;
}

const MONTHS_RO = [
  "ian.",
  "feb.",
  "mar.",
  "apr.",
  "mai",
  "iun.",
  "iul.",
  "aug.",
  "sept.",
  "oct.",
  "nov.",
  "dec.",
] as const;

export function formatDemoDate(isoDate: string | null): string {
  if (isoDate == null) {
    return "Nespecificat";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return "Nespecificat";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return "Nespecificat";
  }

  return `${day} ${MONTHS_RO[month - 1]} ${year}`;
}

export function matchesTimelineFilter(
  type: TimelineEventType,
  filter: TimelineFilter,
): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "treatment") {
    return type === "treatment_change";
  }
  if (filter === "consultation") {
    return type === "consultation";
  }
  if (filter === "analysis") {
    return type === "analysis";
  }
  if (filter === "observation") {
    return type === "observation";
  }
  if (filter === "profile") {
    return type === "profile_update";
  }
  return false;
}
