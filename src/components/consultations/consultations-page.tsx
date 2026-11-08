"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import {
  formatChatDay,
  formatChatTime,
  previewText,
} from "@/lib/consultations/format";
import {
  appendMessage,
  createConversation,
  listConversationsForPatient,
  subscribeConsultations,
} from "@/lib/consultations/store";
import {
  DELIVERY_LABEL,
  STATUS_LABEL,
  type ConsultationStatus,
  type Conversation,
} from "@/lib/consultations/types";
import { getPatientDashboard } from "@/lib/patient-dashboard/fixtures";
import {
  patientRelationSchema,
  patientSexSchema,
  type PatientRelation,
  type PatientSex,
} from "@/lib/patient-select";
import { cn } from "@/lib/utils";

function resolveRelation(raw: string | null): PatientRelation {
  const parsed = patientRelationSchema.safeParse(raw);
  return parsed.success ? parsed.data : "self";
}

function resolveSex(raw: string | null): PatientSex {
  const parsed = patientSexSchema.safeParse(raw);
  return parsed.success ? parsed.data : "female";
}

function statusClass(status: ConsultationStatus): string {
  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "in_progress") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  return "border-border bg-muted text-muted-foreground";
}

export function ConsultationsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const patientId = typeof params.id === "string" ? params.id : "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(
    () => searchParams.get("chat") != null,
  );

  const patient = useMemo(() => {
    const firstName = searchParams.get("nume") ?? undefined;
    const relation = resolveRelation(searchParams.get("relatie"));
    const sex = resolveSex(searchParams.get("sex"));
    return getPatientDashboard(patientId, firstName, relation, sex).person;
  }, [patientId, searchParams]);

  const dashboardHref = useMemo(() => {
    const query = new URLSearchParams(searchParams.toString());
    query.delete("chat");
    query.delete("nou");
    const value = query.toString();
    return value.length > 0
      ? `/pacient/${patientId}?${value}`
      : `/pacient/${patientId}`;
  }, [patientId, searchParams]);

  const conversations = useSyncExternalStore(
    subscribeConsultations,
    () => listConversationsForPatient(patientId),
    () => [],
  );

  const chatFromUrl = searchParams.get("chat");
  const activeId =
    chatFromUrl != null &&
    conversations.some((conversation) => conversation.id === chatFromUrl)
      ? chatFromUrl
      : (conversations[0]?.id ?? null);

  const activeConversation = useMemo(() => {
    if (activeId == null) {
      return null;
    }
    return (
      conversations.find((conversation) => conversation.id === activeId) ?? null
    );
  }, [activeId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversation?.messages.length, activeId]);

  function openConversation(conversationId: string) {
    const query = new URLSearchParams(searchParams.toString());
    query.set("chat", conversationId);
    query.delete("nou");
    router.replace(
      `/pacient/${patientId}/consultatii?${query.toString()}`,
    );
    setMobileShowChat(true);
  }

  function handleNewChat() {
    const created = createConversation({
      patientId,
      patientName: patient.firstName,
    });
    openConversation(created.id);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeConversation == null || draft.trim().length === 0) {
      return;
    }

    appendMessage(activeConversation.id, draft);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (activeConversation == null || draft.trim().length === 0) {
        return;
      }
      appendMessage(activeConversation.id, draft);
      setDraft("");
    }
  }

  const showChatOnMobile = mobileShowChat && activeConversation != null;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={dashboardHref}
              className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Înapoi
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
            <p className="truncate text-sm">
              <span className="font-semibold tracking-[0.14em] text-foreground/70 uppercase">
                KidOS
              </span>
              <span className="text-muted-foreground"> · Consultații · </span>
              <span className="font-medium">{patient.firstName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Chat nou
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden">
        <aside
          className={cn(
            "min-w-0 flex-col border-r border-border md:flex md:w-[36%]",
            showChatOnMobile ? "hidden md:flex" : "flex w-full",
          )}
        >
          <div className="shrink-0 border-b border-border px-4 py-3">
            <h1 className="text-base font-semibold tracking-tight">Conversații</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Date demonstrative. Mesajele rămân locale pe acest dispozitiv.
            </p>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Lista conversațiilor">
            {conversations.length === 0 ? (
              <li className="px-4 py-8 text-sm text-muted-foreground">
                Nicio conversație încă. Apasă „Chat nou” sau „Solicită consultație”.
              </li>
            ) : (
              conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors duration-150",
                      "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      activeId === conversation.id && "bg-muted/80",
                    )}
                  >
                    <ProfileAvatar
                      label={patient.firstName}
                      size="sm"
                      sex={patient.sex}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate font-medium">
                          {conversation.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatChatTime(conversation.updatedAt)}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <StatusPill status={conversation.status} />
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {conversation.messages.length > 0
                          ? previewText(
                              conversation.messages[
                                conversation.messages.length - 1
                              ]?.text ?? "",
                            )
                          : "Fără mesaje"}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section
          className={cn(
            "min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,oklch(0.99_0_0),oklch(0.97_0_0))] md:flex",
            showChatOnMobile ? "flex" : "hidden",
          )}
        >
          {activeConversation ? (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="mb-1 text-sm text-muted-foreground underline-offset-4 hover:underline md:hidden"
                  >
                    Lista
                  </button>
                  <p className="truncate font-semibold tracking-tight">
                    {activeConversation.title}
                  </p>
                  <div className="mt-1">
                    <StatusPill status={activeConversation.status} />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {activeConversation.messages.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-6 text-center text-sm text-muted-foreground">
                    Scrie primul mesaj. Momentan nu există răspunsuri automate —
                    mesajele rămân „În așteptare”.
                  </p>
                ) : (
                  groupByDay(activeConversation.messages).map((group) => (
                    <div key={group.day} className="space-y-3">
                      <p className="sticky top-0 z-10 mx-auto w-fit rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {group.day}
                      </p>
                      {group.messages.map((message) => (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-3.5 py-2 text-background sm:max-w-[70%]">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.text}
                            </p>
                            <p className="mt-1 flex items-center justify-end gap-2 text-[10px] text-background/70">
                              <span>{formatChatTime(message.sentAt)}</span>
                              <span>·</span>
                              <span>{DELIVERY_LABEL[message.delivery]}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="shrink-0 border-t border-border bg-background px-3 py-3 sm:px-4"
              >
                <div className="flex items-end gap-2">
                  <label className="sr-only" htmlFor="consult-message">
                    Mesaj
                  </label>
                  <textarea
                    ref={inputRef}
                    id="consult-message"
                    rows={1}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scrie un mesaj…"
                    maxLength={2000}
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={draft.trim().length === 0}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Trimite mesajul"
                  >
                    ↑
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="max-w-sm space-y-3">
                <p className="text-lg font-semibold tracking-tight">
                  Alege o conversație
                </p>
                <p className="text-sm text-muted-foreground">
                  Selectează un chat din stânga sau creează unul nou pentru{" "}
                  {patient.firstName}.
                </p>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Chat nou
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ConsultationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        statusClass(status),
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function groupByDay(messages: Conversation["messages"]) {
  const groups: { day: string; messages: Conversation["messages"] }[] = [];

  for (const message of messages) {
    const day = formatChatDay(message.sentAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.messages.push(message);
    } else {
      groups.push({ day, messages: [message] });
    }
  }

  return groups;
}
