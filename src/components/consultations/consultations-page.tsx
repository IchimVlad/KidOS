"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DemoDialog,
  DialogActions,
} from "@/components/patient-select/dialog";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import {
  formatChatDay,
  formatChatTime,
  previewText,
} from "@/lib/consultations/format";
import {
  DELIVERY_LABEL,
  STATUS_LABEL,
  type ChatMessage,
  type ConsultationStatus,
  type ConversationWithSenders,
} from "@/lib/consultations/types";
import type { PatientSex } from "@/lib/patient-select";
import { cn } from "@/lib/utils";

function statusClass(status: ConsultationStatus): string {
  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "in_progress") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  return "border-border bg-muted text-muted-foreground";
}

type UiConversation = ConversationWithSenders;

export function ConsultationsPage({
  patientId,
  patientName,
  patientSex,
  initialConversations,
}: {
  patientId: string;
  patientName: string;
  patientSex: PatientSex;
  initialConversations: UiConversation[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conversations, setConversations] =
    useState<UiConversation[]>(initialConversations);
  const [conversationsBaseline, setConversationsBaseline] =
    useState(initialConversations);
  const [mobileShowChat, setMobileShowChat] = useState(
    () => searchParams.get("chat") != null,
  );

  if (initialConversations !== conversationsBaseline) {
    setConversationsBaseline(initialConversations);
    setConversations(initialConversations);
  }

  const dashboardHref = `/pacient/${patientId}`;

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
    router.replace(
      `/pacient/${patientId}/consultatii?chat=${conversationId}`,
    );
    setMobileShowChat(true);
  }

  async function handleNewChat() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/pacient/${patientId}/consultations`, {
        method: "POST",
      });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        conversation: UiConversation;
      };
      setConversations((current) => [payload.conversation, ...current]);
      openConversation(payload.conversation.id);
      setDraft("");
      inputRef.current?.focus();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function clearActiveChatFromUrl() {
    router.replace(`/pacient/${patientId}/consultatii`);
    setMobileShowChat(false);
    setDraft("");
  }

  async function handleConfirmDelete() {
    if (pendingDeleteId == null || busy) {
      return;
    }

    const deletedId = pendingDeleteId;
    const wasActive = deletedId === activeId;
    setBusy(true);
    try {
      const response = await fetch(`/api/consultations/${deletedId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        return;
      }

      const remaining = conversations.filter(
        (conversation) => conversation.id !== deletedId,
      );
      setConversations(remaining);
      setPendingDeleteId(null);
      router.refresh();

      if (!wasActive) {
        return;
      }

      if (remaining[0]) {
        openConversation(remaining[0].id);
        setDraft("");
        return;
      }

      clearActiveChatFromUrl();
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(text: string) {
    if (activeConversation == null || text.trim().length === 0 || busy) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        `/api/consultations/${activeConversation.id}/messages`,
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
      const now = new Date().toISOString();
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== activeConversation.id) {
            return conversation;
          }
          return {
            ...conversation,
            updatedAt: now,
            messages: [...conversation.messages, payload.message],
          };
        }),
      );
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
              <span className="font-semibold tracking-tight text-foreground">
                Kidos
              </span>
              <span className="text-muted-foreground"> · Consultații · </span>
              <span className="font-medium">{patientName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleNewChat()}
            disabled={busy}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40"
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
              Mesajele sunt salvate în baza de date.
            </p>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Lista conversațiilor">
            {conversations.length === 0 ? (
              <li className="px-4 py-8 text-sm text-muted-foreground">
                Nicio conversație încă. Apasă „Chat nou” sau „Solicită consultație”.
              </li>
            ) : (
              conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className={cn(
                    "group flex items-stretch border-b border-border/70",
                    activeId === conversation.id && "bg-muted/80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <ProfileAvatar
                      label={patientName}
                      size="sm"
                      sex={patientSex}
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
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(conversation.id)}
                    className="shrink-0 self-center px-3 py-2 text-xs font-medium text-muted-foreground opacity-100 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    aria-label={`Șterge ${conversation.title}`}
                  >
                    Șterge
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
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(activeConversation.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Șterge
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                {activeConversation.messages.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-background/80 px-4 py-6 text-center text-sm text-muted-foreground">
                    Scrie primul mesaj. Răspunsurile medicului apar aici când
                    există.
                  </p>
                ) : (
                  groupByDay(activeConversation.messages).map((group) => (
                    <div key={group.day} className="space-y-3">
                      <p className="sticky top-0 z-10 mx-auto w-fit rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {group.day}
                      </p>
                      {group.messages.map((message) => {
                        const fromPatient = message.sender === "patient";
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              fromPatient ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-3.5 py-2 sm:max-w-[70%]",
                                fromPatient
                                  ? "rounded-br-md bg-foreground text-background"
                                  : "rounded-bl-md border border-border bg-background text-foreground",
                              )}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.text}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 flex items-center gap-2 text-[10px]",
                                  fromPatient
                                    ? "justify-end text-background/70"
                                    : "justify-start text-muted-foreground",
                                )}
                              >
                                <span>{formatChatTime(message.sentAt)}</span>
                                {fromPatient ? (
                                  <>
                                    <span>·</span>
                                    <span>
                                      {DELIVERY_LABEL[message.delivery]}
                                    </span>
                                  </>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        );
                      })}
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
                    disabled={draft.trim().length === 0 || busy}
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
                  {patientName}.
                </p>
                <button
                  type="button"
                  onClick={() => void handleNewChat()}
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Chat nou
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <DemoDialog
        open={pendingDeleteId != null}
        title="Ștergi conversația?"
        description="Mesajele vor fi eliminate din baza de date. Acțiunea nu poate fi anulată."
        onClose={() => setPendingDeleteId(null)}
      >
        <DialogActions
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => void handleConfirmDelete()}
          confirmLabel="Șterge"
          disabled={busy}
        />
      </DemoDialog>
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

function groupByDay(
  messages: Array<ChatMessage & { sender: "patient" | "doctor" }>,
) {
  const groups: {
    day: string;
    messages: Array<ChatMessage & { sender: "patient" | "doctor" }>;
  }[] = [];

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
