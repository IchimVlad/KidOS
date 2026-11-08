"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import {
  formatChatDay,
  formatChatTime,
  previewText,
} from "@/lib/consultations/format";
import type { ChatMessage } from "@/lib/consultations/types";
import {
  DOCTOR_TAB_LABEL,
  doctorStatusLabel,
  type DoctorConsultation,
  type DoctorInboxTab,
  type DoctorPatientContext,
  type DoctorSummary,
} from "@/lib/doctor/types";
import { cn } from "@/lib/utils";

export function DoctorConsultationsPage({
  doctor,
  initialRequested,
  initialActive,
  initialClosed,
}: {
  doctor: DoctorSummary;
  initialRequested: DoctorConsultation[];
  initialActive: DoctorConsultation[];
  initialClosed: DoctorConsultation[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const notesTimerRef = useRef<number | null>(null);

  const [tab, setTab] = useState<DoctorInboxTab>("requested");
  const [requested, setRequested] = useState(initialRequested);
  const [active, setActive] = useState(initialActive);
  const [closed, setClosed] = useState(initialClosed);
  const [baseline, setBaseline] = useState({
    requested: initialRequested,
    active: initialActive,
    closed: initialClosed,
  });
  const [draft, setDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(
    () => searchParams.get("chat") != null,
  );
  const [contextOpen, setContextOpen] = useState(false);
  const [patientContext, setPatientContext] =
    useState<DoctorPatientContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  if (
    initialRequested !== baseline.requested ||
    initialActive !== baseline.active ||
    initialClosed !== baseline.closed
  ) {
    setBaseline({
      requested: initialRequested,
      active: initialActive,
      closed: initialClosed,
    });
    setRequested(initialRequested);
    setActive(initialActive);
    setClosed(initialClosed);
  }

  const inbox = useMemo(() => {
    if (tab === "requested") {
      return requested;
    }
    if (tab === "active") {
      return active;
    }
    return closed;
  }, [tab, requested, active, closed]);

  const allConsultations = useMemo(
    () => [...requested, ...active, ...closed],
    [requested, active, closed],
  );

  const chatFromUrl = searchParams.get("chat");
  const activeId =
    chatFromUrl != null &&
    allConsultations.some((item) => item.id === chatFromUrl)
      ? chatFromUrl
      : (inbox[0]?.id ?? allConsultations[0]?.id ?? null);

  const activeConsultation = useMemo(() => {
    if (activeId == null) {
      return null;
    }
    return allConsultations.find((item) => item.id === activeId) ?? null;
  }, [activeId, allConsultations]);

  const showChatOnMobile = mobileShowChat && activeConsultation != null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeConsultation?.messages.length, activeId]);

  useEffect(() => {
    const input = inputRef.current;
    if (input == null) {
      return;
    }
    input.style.height = "0px";
    const nextHeight = Math.min(input.scrollHeight, 96);
    input.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [draft, activeId, mobileShowChat]);

  useEffect(() => {
    setNotesDraft(activeConsultation?.doctorNotes ?? "");
    setPatientContext(null);
  }, [activeConsultation?.id, activeConsultation?.doctorNotes]);

  useEffect(() => {
    if (activeConsultation == null) {
      return;
    }

    let cancelled = false;
    setContextLoading(true);
    void fetch(
      `/api/medic/${doctor.id}/patients/${activeConsultation.patientId}/context`,
    )
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as { context: DoctorPatientContext };
      })
      .then((payload) => {
        if (!cancelled && payload != null) {
          setPatientContext(payload.context);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setContextLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeConsultation?.patientId, activeConsultation?.id, doctor.id]);

  function replaceConsultation(next: DoctorConsultation) {
    setRequested((current) =>
      current.filter((item) => item.id !== next.id),
    );
    setActive((current) => current.filter((item) => item.id !== next.id));
    setClosed((current) => current.filter((item) => item.id !== next.id));

    if (next.status === "pending") {
      setRequested((current) => [next, ...current]);
      setTab("requested");
      return;
    }
    if (next.status === "in_progress") {
      setActive((current) => [next, ...current]);
      setTab("active");
      return;
    }
    setClosed((current) => [next, ...current]);
    setTab("closed");
  }

  function patchConsultation(
    consultationId: string,
    patch: Partial<DoctorConsultation>,
  ) {
    const updater = (current: DoctorConsultation[]) =>
      current.map((item) =>
        item.id === consultationId ? { ...item, ...patch } : item,
      );
    setRequested(updater);
    setActive(updater);
    setClosed(updater);
  }

  function openConsultation(consultationId: string) {
    router.replace(
      `/medic/${doctor.id}/consultatii?chat=${consultationId}`,
    );
    setMobileShowChat(true);
  }

  async function handleAccept() {
    if (activeConsultation == null || busy) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/medic/${doctor.id}/consultations/${activeConsultation.id}/accept`,
        { method: "POST" },
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        consultation: DoctorConsultation;
      };
      replaceConsultation(payload.consultation);
      openConsultation(payload.consultation.id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (activeConsultation == null || busy) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/medic/${doctor.id}/consultations/${activeConsultation.id}/complete`,
        { method: "POST" },
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        consultation: DoctorConsultation;
      };
      replaceConsultation(payload.consultation);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(text: string) {
    if (
      activeConsultation == null ||
      activeConsultation.status === "closed" ||
      text.trim().length === 0 ||
      busy
    ) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        `/api/medic/${doctor.id}/consultations/${activeConsultation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        message: ChatMessage & { sender: "patient" | "doctor" };
      };

      const updated: DoctorConsultation = {
        ...activeConsultation,
        status: "in_progress",
        waitingForDoctor: false,
        updatedAt: new Date().toISOString(),
        messages: [...activeConsultation.messages, payload.message],
      };
      replaceConsultation(updated);
      setDraft("");
      inputRef.current?.focus();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  function scheduleNotesSave(value: string) {
    setNotesDraft(value);
    if (activeConsultation == null) {
      return;
    }
    if (notesTimerRef.current != null) {
      window.clearTimeout(notesTimerRef.current);
    }
    notesTimerRef.current = window.setTimeout(() => {
      void fetch(
        `/api/medic/${doctor.id}/consultations/${activeConsultation.id}/notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        },
      ).then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          consultation: DoctorConsultation;
        };
        patchConsultation(payload.consultation.id, {
          doctorNotes: payload.consultation.doctorNotes,
        });
      });
    }, 600);
  }

  const panelMotion =
    "transition-transform duration-300 ease-out motion-reduce:transition-none";

  const tabCounts: Record<DoctorInboxTab, number> = {
    requested: requested.length,
    active: active.length,
    closed: closed.length,
  };

  return (
    <div className="chat-shell flex h-dvh flex-col overflow-hidden text-foreground">
      <header
        className={cn(
          "shrink-0 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-sm",
          showChatOnMobile ? "hidden md:block" : "block",
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/medic"
              className="inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-chat-cta px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Medici
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
            <p className="truncate text-sm">
              <span className="font-semibold tracking-tight">KidOS Medic</span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-medium">{doctor.fullName}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="relative mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-hidden md:flex">
        <aside
          className={cn(
            "absolute inset-0 z-10 flex min-w-0 flex-col border-r border-border/70 bg-background/80 md:static md:z-auto md:w-[34%] md:bg-background/55",
            panelMotion,
            showChatOnMobile
              ? "max-md:pointer-events-none max-md:invisible max-md:-translate-x-full"
              : "max-md:translate-x-0 max-md:visible",
          )}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-border/70 bg-background/85 px-4 backdrop-blur-sm">
            <h1 className="text-base font-semibold tracking-tight">Inbox</h1>
          </div>

          <div className="flex shrink-0 gap-1 border-b border-border/40 px-2 py-2">
            {(Object.keys(DOCTOR_TAB_LABEL) as DoctorInboxTab[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-chat-cta px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tab === item
                      ? "bg-bubble-out text-bubble-out-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {DOCTOR_TAB_LABEL[item]}
                  <span className="tabular-nums opacity-80">
                    {tabCounts[item]}
                  </span>
                </button>
              ),
            )}
          </div>

          <ul
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
            aria-label="Lista consultațiilor"
          >
            {inbox.length === 0 ? (
              <li className="px-4 py-8 text-sm text-muted-foreground">
                Nicio consultație în acest tab.
              </li>
            ) : (
              inbox.map((consultation) => (
                <li
                  key={consultation.id}
                  className={cn(
                    "group relative flex min-h-14 items-stretch border-b border-border/30",
                    activeId === consultation.id && "bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "w-1 shrink-0 self-stretch rounded-r-full",
                      consultation.status === "pending"
                        ? "bg-status-wait"
                        : consultation.status === "in_progress"
                          ? "bg-status-live"
                          : "bg-status-done",
                    )}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => openConsultation(consultation.id)}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold tracking-tight">
                          {consultation.patientName}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {consultation.patientAgeLabel}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {formatChatTime(consultation.updatedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-foreground/70">
                        {consultation.messages.length > 0
                          ? previewText(
                              consultation.messages[
                                consultation.messages.length - 1
                              ]?.text ?? "",
                            )
                          : consultation.title}
                      </span>
                      {consultation.waitingForDoctor ? (
                        <span className="mt-1 block text-[11px] font-medium text-status-wait-foreground">
                          Așteaptă răspuns
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section
          className={cn(
            "chat-panel absolute inset-0 z-20 flex min-w-0 flex-col lg:flex-row md:static md:z-auto md:flex md:flex-1",
            panelMotion,
            showChatOnMobile
              ? "max-md:translate-x-0 max-md:visible"
              : "max-md:pointer-events-none max-md:invisible max-md:translate-x-full",
          )}
        >
          {activeConsultation ? (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/70 bg-background/85 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-sm max-md:h-[calc(4rem+env(safe-area-inset-top))] md:px-4 md:pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      inputRef.current?.blur();
                      setMobileShowChat(false);
                    }}
                    className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-chat-cta text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                    aria-label="Înapoi la inbox"
                  >
                    <BackIcon />
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ProfileAvatar
                      label={activeConsultation.patientName}
                      size="sm"
                      sex={activeConsultation.patientSex}
                      className="size-9 border-[2.5px]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {activeConsultation.patientName}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {activeConsultation.patientAgeLabel}
                        </span>
                      </p>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-chat-cta border px-2 py-0.5 text-[11px] font-medium",
                          activeConsultation.status === "pending"
                            ? "border-status-wait/30 bg-status-wait-soft text-status-wait-foreground"
                            : activeConsultation.status === "in_progress"
                              ? "border-status-live/30 bg-status-live-soft text-status-live-foreground"
                              : "border-status-done/30 bg-status-done-soft text-status-done-foreground",
                        )}
                      >
                        {doctorStatusLabel(activeConsultation.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setContextOpen((open) => !open)}
                      className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-chat-cta px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                    >
                      Context
                    </button>
                    {activeConsultation.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => void handleAccept()}
                        disabled={busy}
                        className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-chat-cta bg-bubble-out px-3 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        Preia
                      </button>
                    ) : null}
                    {activeConsultation.status === "in_progress" ? (
                      <button
                        type="button"
                        onClick={() => void handleComplete()}
                        disabled={busy}
                        className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-chat-cta border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        Finalizează
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                  {activeConsultation.messages.length === 0 ? (
                    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                      <p className="text-base font-semibold tracking-tight">
                        Niciun mesaj încă
                      </p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Preia consultația și răspunde părinților aici.
                      </p>
                    </div>
                  ) : (
                    <DoctorMessageThread
                      messages={activeConsultation.messages}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {activeConsultation.status === "closed" ? (
                  <div className="shrink-0 border-t border-border/70 bg-background/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
                    Consultația este închisă.
                  </div>
                ) : (
                  <form
                    onSubmit={handleSend}
                    className="shrink-0 border-t border-border/70 bg-background/90 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
                  >
                    <div className="flex items-end gap-2">
                      <label className="sr-only" htmlFor="doctor-message">
                        Răspuns medic
                      </label>
                      <textarea
                        ref={inputRef}
                        id="doctor-message"
                        rows={1}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Răspunde pacientului…"
                        maxLength={2000}
                        className="max-h-24 min-h-11 flex-1 resize-none overflow-y-auto rounded-chat border border-input bg-bubble-in px-3.5 py-2.5 text-sm leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <button
                        type="submit"
                        disabled={draft.trim().length === 0 || busy}
                        className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-chat-cta bg-bubble-out text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 disabled:opacity-35 sm:h-11 sm:w-auto sm:px-4"
                        aria-label="Trimite răspunsul"
                      >
                        <SendIcon />
                        <span className="hidden sm:inline">Trimite</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <DoctorContextPanel
                open={contextOpen}
                onClose={() => setContextOpen(false)}
                loading={contextLoading}
                context={patientContext}
                notes={notesDraft}
                notesDisabled={activeConsultation.status === "closed"}
                onNotesChange={scheduleNotesSave}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="max-w-sm space-y-2">
                <p className="text-lg font-semibold tracking-tight">
                  Alege o consultație
                </p>
                <p className="text-sm text-muted-foreground">
                  Selectează din inbox o consultație de preluat sau în curs.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DoctorContextPanel({
  open,
  onClose,
  loading,
  context,
  notes,
  notesDisabled,
  onNotesChange,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  context: DoctorPatientContext | null;
  notes: string;
  notesDisabled: boolean;
  onNotesChange: (value: string) => void;
}) {
  return (
    <aside
      className={cn(
        "shrink-0 border-border/70 bg-background/95",
        "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30 max-lg:w-[min(100%,22rem)] max-lg:border-l max-lg:shadow-xl",
        "lg:flex lg:w-[22rem] lg:flex-col lg:border-l",
        open ? "max-lg:flex" : "max-lg:hidden",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
        <p className="text-sm font-semibold tracking-tight">Context pacient</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-10 items-center justify-center rounded-chat-cta text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Închide contextul"
        >
          ×
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {loading && context == null ? (
          <p className="text-sm text-muted-foreground">Se încarcă contextul…</p>
        ) : context == null ? (
          <p className="text-sm text-muted-foreground">
            Contextul pacientului nu este disponibil.
          </p>
        ) : (
          <>
            <section className="space-y-1">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Identitate
              </h2>
              <p className="text-sm font-medium">
                {context.patientName} · {context.ageLabel}
              </p>
              {context.allergies ? (
                <p className="text-sm text-muted-foreground">
                  Alergii: {context.allergies}
                </p>
              ) : null}
              {context.conditions ? (
                <p className="text-sm text-muted-foreground">
                  Afecțiuni: {context.conditions}
                </p>
              ) : null}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Măsurători recente
              </h2>
              {context.measurements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Fără măsurători.</p>
              ) : (
                <ul className="space-y-1.5">
                  {context.measurements.map((measurement) => (
                    <li key={measurement.id} className="text-sm">
                      <span className="font-medium">{measurement.label}</span>
                      {": "}
                      {measurement.value}
                      {measurement.unit ? ` ${measurement.unit}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Timeline
              </h2>
              {context.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Fără evenimente.</p>
              ) : (
                <ul className="space-y-2">
                  {context.events.map((event) => (
                    <li key={event.id} className="text-sm">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.date}
                        {event.summary ? ` · ${event.summary}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Rețete
              </h2>
              {context.prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Fără rețete.</p>
              ) : (
                <ul className="space-y-2">
                  {context.prescriptions.map((prescription) => (
                    <li key={prescription.id} className="text-sm">
                      <p className="font-medium">{prescription.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.date} · {prescription.doctorName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Documente
              </h2>
              {context.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Fără documente.</p>
              ) : (
                <ul className="space-y-1.5">
                  {context.documents.map((document) => (
                    <li key={document.id} className="text-sm">
                      {document.title}
                      <span className="text-muted-foreground">
                        {" "}
                        · {document.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <section className="space-y-2 border-t border-border/50 pt-4">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Notă internă
          </h2>
          <textarea
            value={notes}
            disabled={notesDisabled}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Vizibilă doar pentru medic…"
            maxLength={5000}
            rows={4}
            className="w-full resize-none rounded-chat border border-input bg-bubble-in px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        </section>
      </div>
    </aside>
  );
}

function DoctorMessageThread({
  messages,
}: {
  messages: Array<ChatMessage & { sender: "patient" | "doctor" }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      {messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : null;
        const day = formatChatDay(message.sentAt);
        const previousDay =
          previous != null ? formatChatDay(previous.sentAt) : null;
        const showDay = day !== previousDay;
        const fromDoctor = message.sender === "doctor";
        const startOfRun =
          previous == null ||
          previous.sender !== message.sender ||
          showDay;

        return (
          <Fragment key={message.id}>
            {showDay ? (
              <p className="sticky top-0 z-10 mx-auto my-3 w-fit rounded-chat-cta bg-bubble-in/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm first:mt-0">
                {day}
              </p>
            ) : null}
            <div
              className={cn(
                "flex items-end gap-2",
                fromDoctor ? "justify-end" : "justify-start",
                startOfRun ? "mt-3" : "mt-1",
                index === 0 && !showDay && "mt-0",
              )}
            >
              {!fromDoctor ? (
                startOfRun ? (
                  <span
                    className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-chat-cta border border-border/70 bg-bubble-in text-[11px] font-semibold text-muted-foreground"
                    aria-hidden="true"
                  >
                    P
                  </span>
                ) : (
                  <span className="size-8 shrink-0" aria-hidden="true" />
                )
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2.5 sm:max-w-[72%]",
                  fromDoctor
                    ? "rounded-chat rounded-br-md bg-bubble-out text-bubble-out-foreground"
                    : "rounded-chat rounded-bl-md border border-border/50 bg-bubble-in text-bubble-in-foreground shadow-[0_1px_2px_oklch(0.2_0.02_240/0.06)]",
                )}
              >
                {!fromDoctor && startOfRun ? (
                  <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                    Pacient
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.text}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-[10px] tabular-nums",
                    fromDoctor
                      ? "text-right text-bubble-out-foreground/60"
                      : "text-left text-muted-foreground",
                  )}
                >
                  {formatChatTime(message.sentAt)}
                </p>
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h12" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
