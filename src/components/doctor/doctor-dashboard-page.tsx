"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function triagePreview(consultation: DoctorConsultation): string {
  const firstPatient = consultation.messages.find(
    (message) => message.sender === "patient",
  );
  if (firstPatient) {
    return previewText(firstPatient.text, 96);
  }
  const last = consultation.messages[consultation.messages.length - 1];
  return last ? previewText(last.text, 96) : consultation.title;
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
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [queue, setQueue] = useState(requested);
  const [baselineRequested, setBaselineRequested] = useState(requested);

  if (requested !== baselineRequested) {
    setBaselineRequested(requested);
    setQueue(requested);
  }

  const waitingReply = active.filter((item) => item.waitingForDoctor);
  const completedToday = closed.filter((item) =>
    isSameLocalDay(item.updatedAt),
  );
  const recentOpen =
    active.find((item) => item.waitingForDoctor) ?? active[0] ?? null;

  async function handleAccept(consultationId: string) {
    if (busyId != null) {
      return;
    }
    setBusyId(consultationId);
    try {
      const response = await fetch(
        `/api/medic/${doctor.id}/consultations/${consultationId}/accept`,
        { method: "POST" },
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        consultation: DoctorConsultation;
      };
      setQueue((current) =>
        current.filter((item) => item.id !== payload.consultation.id),
      );
      router.push(
        `/medic/consultatii?chat=${payload.consultation.id}&tab=active`,
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

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
            href="/medic/consultatii?tab=active"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta bg-bubble-out px-4 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Deschide chat
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {doctor.specialty ?? "Medic"} · solicitările noi se preiau aici, chatul
            e doar pentru consultațiile acceptate
          </p>
        </div>

        <section
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Sumar coadă"
        >
          <SummaryCard
            href="#solicitari"
            label="Solicitări noi"
            value={queue.length}
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

        <section
          id="solicitari"
          className="rounded-2xl border border-status-wait/35 bg-status-wait-soft/40 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                Solicitări noi
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pending — încă neacceptate. Preia ca să le deschizi în chat.
              </p>
            </div>
            <span className="inline-flex min-h-8 items-center rounded-chat-cta border border-status-wait/40 bg-status-wait-soft px-2.5 text-xs font-semibold tabular-nums text-status-wait-foreground">
              {queue.length}
            </span>
          </div>

          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu ai solicitări în așteptare.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {queue.map((consultation) => (
                <li
                  key={consultation.id}
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
                    <p className="mt-0.5 text-sm text-foreground/80">
                      {triagePreview(consultation)}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-status-wait-foreground">
                      Solicitare · {waitingLabel(consultation.createdAt) || "Nouă"}
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatChatTime(consultation.createdAt)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAccept(consultation.id)}
                    disabled={busyId != null}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta bg-bubble-out px-4 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {busyId === consultation.id ? "Se preia…" : "Preia"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border/70 bg-background/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                Așteaptă răspunsul tău
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Consultații acceptate unde părintele a scris ultimul.
              </p>
            </div>
            <Link
              href="/medic/consultatii?tab=active"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Vezi chatul
            </Link>
          </div>

          {waitingReply.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nicio conversație nu așteaptă răspuns acum.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {waitingReply.slice(0, 5).map((consultation) => {
                const last =
                  consultation.messages[consultation.messages.length - 1];
                return (
                  <li
                    key={consultation.id}
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
                        {waitingLabel(consultation.updatedAt)}
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatChatTime(consultation.updatedAt)}
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`/medic/consultatii?chat=${consultation.id}&tab=active`}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-chat-cta border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Deschide chat
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
                    : "Consultație în curs"}
                </p>
              </div>
              <Link
                href={`/medic/consultatii?chat=${recentOpen.id}&tab=active`}
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
