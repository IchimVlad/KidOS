const MONTHS_RO_SHORT = [
  "ian",
  "feb",
  "mar",
  "apr",
  "mai",
  "iun",
  "iul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

function toValidDate(isoOrDate: string | Date): Date | null {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatChatTime(iso: string): string {
  const date = toValidDate(iso);
  if (date == null) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatChatDay(iso: string): string {
  const date = toValidDate(iso);
  if (date == null) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatChatShortDate(isoOrDate: string | Date): string {
  const date = toValidDate(isoOrDate);
  if (date == null) {
    return "";
  }

  return `${date.getDate()} ${MONTHS_RO_SHORT[date.getMonth()]}`;
}

export function formatConsultationTitle(isoOrDate: string | Date): string {
  const shortDate = formatChatShortDate(isoOrDate);
  return shortDate.length > 0 ? `Consultație · ${shortDate}` : "Consultație";
}

export function previewText(text: string, max = 64): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}
