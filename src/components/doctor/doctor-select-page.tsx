"use client";

import Link from "next/link";
import type { DoctorSummary } from "@/lib/doctor/types";
import { cn } from "@/lib/utils";

export function DoctorSelectPage({
  initialDoctors,
}: {
  initialDoctors: DoctorSummary[];
}) {
  return (
    <main className="chat-shell mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-chat-cta px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Înapoi
        </Link>
        <p className="text-sm font-semibold tracking-tight">KidOS Medic</p>
      </div>

      <div className="mt-10 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Alege medicul</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Intră în inbox-ul de consultații. Fără autentificare în această
          demonstrație — selectează un profil medic din seed.
        </p>
      </div>

      <ul className="mt-8 space-y-3" aria-label="Lista medicilor">
        {initialDoctors.map((doctor) => (
          <li key={doctor.id}>
            <Link
              href={`/medic/${doctor.id}/consultatii`}
              className="flex items-center justify-between gap-4 rounded-chat border border-border/70 bg-bubble-in px-4 py-4 transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold tracking-tight">
                  {doctor.fullName}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {doctor.specialty ?? "Specialitate nespecificată"}
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-chat-cta border px-2.5 py-1 text-[11px] font-medium",
                  doctor.isOnline
                    ? "border-status-live/30 bg-status-live-soft text-status-live-foreground"
                    : "border-status-done/30 bg-status-done-soft text-status-done-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-chat-cta",
                    doctor.isOnline ? "bg-status-live" : "bg-status-done",
                  )}
                  aria-hidden="true"
                />
                {doctor.isOnline ? "Online" : "Offline"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
