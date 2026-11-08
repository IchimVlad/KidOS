"use client";

import Link from "next/link";
import {
  formatChatTime,
  previewText,
} from "@/lib/consultations/format";
import type {
  DoctorConsultation,
  DoctorSummary,
} from "@/lib/doctor/types";
import { cn } from "@/lib/utils";

function isSameLocalDay(iso: string, now = new Date()): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function waitingMinutes(iso: string, now = new Date()): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
}

function waitingLabel(iso: string): string {
  const minutes = waitingMinutes(iso);
  if (minutes == null) {
    return "";
  }
  if (minutes < 60) {
    return `Așteaptă de ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `Așteaptă de ${hours} h`;
}

export function DoctorDashboardPage({
  doctor,
  requested,
  active,
  closed,
}: {
  doctor: DoctorSummary;
  requested: DoctorConsultation[];
  active: DoctorConsultation[];
  closed: DoctorConsultation[];
}) {
  const waitingReply = active.filter((item) => item.waitingForDoctor);
  const completedToday = closed.filter((item) =>
    isSameLocalDay(item.updatedAt),
  );
  const recentOpen =
    active.find((item) => item.waitingForDoctor) ??
    active[0] ??
    requested[0] ??
    null;

  const actionItems = [
    ...requested.map((item) => ({
      consultation: item,
      kind: "requested" as const,
    })),
    ...waitingReply.map((item) => ({
      consultation: item,
      kind: "waiting" as const,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.consultation.updatedAt).getTime() -
        new Date(a.consultation.updatedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="chat-shell min-h-dvh text-foreground">
      <header className="border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Înapoi
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
            <p className="truncate text-sm">
              <span className="font-semibold tracking-tight">KidOS Medic</span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-medium">{doctor.fullName}</span>
            </p>
          </div>
          <Link
            href="/medic/consultatii"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta bg-bubble-out px-4 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Deschide inbox
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {doctor.specialty ?? "Medic"} · coada de consultații de azi
          </p>
        </div>

        <section
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Sumar coadă"
        >
          <SummaryCard
            href="/medic/consultatii?tab=requested"
            label="De preluat"
            value={requested.length}
            tone="wait"
          />
          <SummaryCard
            href="/medic/consultatii?tab=active"
            label="Așteaptă răspunsul tău"
            value={waitingReply.length}
            tone="wait"
          />
          <SummaryCard
            href="/medic/consultatii?tab=active"
            label="În desfășurare"
            value={active.length}
            tone="live"
          />
          <SummaryCard
            href="/medic/consultatii?tab=closed"
            label="Finalizate azi"
            value={completedToday.length}
            tone="done"
          />
        </section>

        <section className="rounded-2xl border border-border/70 bg-background/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Următoarele acțiuni
            </h2>
            <Link
              href="/medic/consultatii"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Vezi tot
            </Link>
          </div>

          {actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu ai consultații care așteaptă acțiune acum.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {actionItems.map(({ consultation, kind }) => {
                const last =
                  consultation.messages[consultation.messages.length - 1];
                return (
                  <li
                    key={`${kind}-${consultation.id}`}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {consultation.patientName}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {consultation.patientAgeLabel}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-foreground/75">
                        {last
                          ? previewText(last.text, 72)
                          : consultation.title}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-status-wait-foreground">
                        {kind === "requested"
                          ? "De preluat"
                          : waitingLabel(consultation.updatedAt)}
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatChatTime(consultation.updatedAt)}
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`/medic/consultatii?chat=${consultation.id}&tab=${kind === "requested" ? "requested" : "active"}`}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta bg-bubble-out px-4 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90"
                    >
                      Deschide
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {recentOpen ? (
          <section className="rounded-2xl border border-border/70 bg-background/80 p-4 sm:p-5">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Continuă aici
            </h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {recentOpen.patientName} · {recentOpen.patientAgeLabel}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recentOpen.waitingForDoctor
                    ? "Așteaptă răspunsul tău"
                    : recentOpen.status === "pending"
                      ? "Solicitare nouă"
                      : "Consultație în curs"}
                </p>
              </div>
              <Link
                href={`/medic/consultatii?chat=${recentOpen.id}&tab=${recentOpen.status === "pending" ? "requested" : "active"}`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                Deschide conversația
              </Link>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function SummaryCard({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone: "wait" | "live" | "done";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "wait" &&
          "border-status-wait/30 bg-status-wait-soft/70 hover:border-status-wait/50",
        tone === "live" &&
          "border-status-live/30 bg-status-live-soft/70 hover:border-status-live/50",
        tone === "done" &&
          "border-status-done/30 bg-status-done-soft/70 hover:border-status-done/50",
      )}
    >
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </p>
    </Link>
  );
}
