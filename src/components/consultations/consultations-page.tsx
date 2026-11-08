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
import {
  DemoDialog,
  DialogActions,
} from "@/components/patient-select/dialog";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import {
  formatChatDay,
  formatChatTime,
  formatConsultationTitle,
  previewText,
} from "@/lib/consultations/format";
import {
  STATUS_LABEL,
  type ChatMessage,
  type ConsultationStatus,
  type ConversationWithSenders,
} from "@/lib/consultations/types";
import {
  MEDICAL_EXTRACTION_CATEGORIES,
  MEDICAL_EXTRACTION_LABEL,
  type MedicalExtractionCategory,
  type MedicalExtractionSelection,
} from "@/lib/medical-extraction";
import type { MedicalExtractionDraft } from "@/lib/data/medical-extractions";
import type { PatientSex } from "@/lib/patient-select";
import { cn } from "@/lib/utils";

function statusDotClass(status: ConsultationStatus): string {
  if (status === "pending") {
    return "bg-status-wait";
  }
  if (status === "in_progress") {
    return "bg-status-live";
  }
  return "bg-status-done";
}

function statusBandClass(status: ConsultationStatus): string {
  if (status === "pending") {
    return "bg-status-wait";
  }
  if (status === "in_progress") {
    return "bg-status-live";
  }
  return "bg-status-done";
}

function statusPillClass(status: ConsultationStatus): string {
  if (status === "pending") {
    return "border-status-wait/30 bg-status-wait-soft text-status-wait-foreground";
  }
  if (status === "in_progress") {
    return "border-status-live/30 bg-status-live-soft text-status-live-foreground";
  }
  return "border-status-done/30 bg-status-done-soft text-status-done-foreground";
}

type UiConversation = ConversationWithSenders;

const EMPTY_PROMPTS = [
  "Are febră și e agitat",
  "Tușește și respiră greu",
] as const;

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
  const [medicalDrafts, setMedicalDrafts] = useState<MedicalExtractionDraft[]>(
    [],
  );
  const [medicalDraftsConversationId, setMedicalDraftsConversationId] =
    useState<string | null>(null);
  const [medicalSelections, setMedicalSelections] = useState<
    Record<string, MedicalExtractionSelection>
  >({});
  const [extractingMedicalInfo, setExtractingMedicalInfo] = useState(false);
  const [reviewingMedicalDraftId, setReviewingMedicalDraftId] = useState<
    string | null
  >(null);
  const [medicalExtractionMessage, setMedicalExtractionMessage] = useState<
    string | null
  >(null);
  const [conversations, setConversations] =
    useState<UiConversation[]>(initialConversations);
  const [conversationsBaseline, setConversationsBaseline] =
    useState(initialConversations);
  const [mobileShowChat, setMobileShowChat] = useState(
    () => searchParams.get("chat") != null,
  );
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const [listMenuId, setListMenuId] = useState<string | null>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);

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
    if (activeId == null) {
      return;
    }

    const controller = new AbortController();
    void fetch(`/api/consultations/${activeId}/medical-extractions`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          proposals?: MedicalExtractionDraft[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            payload.error ?? "Propunerile medicale nu au putut fi încărcate.",
          );
        }
        setMedicalDraftsConversationId(activeId);
        setMedicalDrafts(payload.proposals ?? []);
        setMedicalSelections({});
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMedicalExtractionMessage(
            error instanceof Error
              ? error.message
              : "Propunerile medicale nu au putut fi încărcate.",
          );
        }
      });

    return () => controller.abort();
  }, [activeId]);

  useEffect(() => {
    if (!mobileShowChat || activeConversation == null) {
      return;
    }
    if (activeConversation.status === "closed") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 280);
    return () => window.clearTimeout(timeoutId);
  }, [mobileShowChat, activeConversation]);

  useEffect(() => {
    if (!chatMenuOpen && listMenuId == null) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (chatMenuRef.current?.contains(target)) {
        return;
      }
      if (listMenuRef.current?.contains(target)) {
        return;
      }
      setChatMenuOpen(false);
      setListMenuId(null);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setChatMenuOpen(false);
        setListMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [chatMenuOpen, listMenuId]);

  function openConversation(conversationId: string) {
    setChatMenuOpen(false);
    setListMenuId(null);
    setMedicalExtractionMessage(null);
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
    setChatMenuOpen(false);
    setMedicalExtractionMessage(null);
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

  async function handleExtractMedicalInfo() {
    if (activeConversation == null || extractingMedicalInfo) {
      return;
    }
    setExtractingMedicalInfo(true);
    setMedicalExtractionMessage(null);
    try {
      const response = await fetch(
        `/api/consultations/${activeConversation.id}/medical-extractions`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        proposal?: MedicalExtractionDraft | null;
        error?: string;
      };
      if (!response.ok) {
        setMedicalExtractionMessage(
          payload.error ?? "Extragerea nu a putut fi finalizată.",
        );
        return;
      }
      const proposal = payload.proposal;
      if (!proposal) {
        setMedicalExtractionMessage(
          "Nu au fost găsite informații medicale noi în conversație.",
        );
        return;
      }
      setMedicalDrafts((current) => [...current, proposal]);
      setMedicalDraftsConversationId(activeConversation.id);
      setMedicalSelections((current) => ({
        ...current,
        [proposal.id]: {
          allergies: [],
          chronicConditions: [],
          currentTreatments: [],
        },
      }));
      setMedicalExtractionMessage(
        "Verificați fiecare informație și selectați doar ce doriți să salvați.",
      );
    } catch {
      setMedicalExtractionMessage(
        "Extragerea nu a putut fi finalizată. Verificați conexiunea și încercați din nou.",
      );
    } finally {
      setExtractingMedicalInfo(false);
    }
  }

  function toggleMedicalFact(
    proposalId: string,
    category: MedicalExtractionCategory,
    index: number,
  ) {
    setMedicalSelections((current) => {
      const selection = current[proposalId] ?? {
        allergies: [],
        chronicConditions: [],
        currentTreatments: [],
      };
      const indices = selection[category];
      return {
        ...current,
        [proposalId]: {
          ...selection,
          [category]: indices.includes(index)
            ? indices.filter((selectedIndex) => selectedIndex !== index)
            : [...indices, index],
        },
      };
    });
  }

  async function reviewMedicalDraft(
    draft: MedicalExtractionDraft,
    action: "accept" | "reject",
  ) {
    if (reviewingMedicalDraftId != null || activeConversation == null) {
      return;
    }
    setReviewingMedicalDraftId(draft.id);
    setMedicalExtractionMessage(null);
    try {
      const response = await fetch(
        `/api/consultations/${activeConversation.id}/medical-extractions/${draft.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            selected: medicalSelections[draft.id] ?? {
              allergies: [],
              chronicConditions: [],
              currentTreatments: [],
            },
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMedicalExtractionMessage(
          payload.error ?? "Propunerea nu a putut fi revizuită.",
        );
        return;
      }
      setMedicalDrafts((current) =>
        current.filter((proposal) => proposal.id !== draft.id),
      );
      setMedicalSelections((current) => {
        const next = { ...current };
        delete next[draft.id];
        return next;
      });
      setMedicalExtractionMessage(
        action === "accept"
          ? "Informațiile selectate au fost adăugate la profil."
          : "Propunerea a fost respinsă.",
      );
      router.refresh();
    } catch {
      setMedicalExtractionMessage(
        "Propunerea nu a putut fi revizuită. Încercați din nou.",
      );
    } finally {
      setReviewingMedicalDraftId(null);
    }
  }

  async function sendMessage(text: string) {
    if (
      activeConversation == null ||
      activeConversation.status === "closed" ||
      text.trim().length === 0 ||
      busy
    ) {
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
  const visibleMedicalDrafts =
    medicalDraftsConversationId === activeConversation?.id
      ? medicalDrafts
      : [];

  const panelMotion =
    "transition-transform duration-300 ease-out motion-reduce:transition-none";

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
              href={dashboardHref}
              className="inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-chat-cta px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Înapoi
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
            <p className="truncate text-sm">
              <span className="font-semibold tracking-tight text-foreground">
                KidOS
              </span>
              <span className="text-muted-foreground"> · Consultații · </span>
              <span className="font-medium">{patientName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleNewChat()}
            disabled={busy}
            className="inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center rounded-chat-cta bg-bubble-out px-4 py-2 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40"
          >
            Chat nou
          </button>
        </div>
      </header>

      <div className="relative mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-hidden md:flex">
        <aside
          className={cn(
            "absolute inset-0 z-10 flex min-w-0 flex-col border-r border-border/70 bg-background/80 md:static md:z-auto md:w-[36%] md:bg-background/55",
            panelMotion,
            showChatOnMobile
              ? "max-md:pointer-events-none max-md:invisible max-md:-translate-x-full"
              : "max-md:translate-x-0 max-md:visible",
          )}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-border/70 bg-background/85 px-4 backdrop-blur-sm">
            <h1 className="text-base font-semibold tracking-tight">
              Consultații
            </h1>
          </div>

          <ul
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
            aria-label="Lista conversațiilor"
          >
            {conversations.length === 0 ? (
              <li className="px-4 py-8 text-sm text-muted-foreground">
                Nicio consultație încă. Apasă „Chat nou” ca să scrii medicului.
              </li>
            ) : (
              conversations.map((conversation) => {
                const listTitle = formatConsultationTitle(
                  conversation.createdAt,
                );
                const lastMessage =
                  conversation.messages[conversation.messages.length - 1];
                const preview =
                  lastMessage != null
                    ? previewText(lastMessage.text)
                    : "Începe conversația";
                const menuOpen = listMenuId === conversation.id;
                const isActive = activeId === conversation.id;

                return (
                  <li
                    key={conversation.id}
                    className={cn(
                      "group relative flex min-h-14 items-stretch border-b border-border/30",
                      isActive && "bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1 shrink-0 self-stretch rounded-r-full",
                        statusBandClass(conversation.status),
                      )}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4"
                    >
                      <ListStatusIcon status={conversation.status} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold tracking-tight">
                            {listTitle}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {formatChatTime(conversation.updatedAt)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block truncate text-sm",
                            lastMessage != null
                              ? "text-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {preview}
                        </span>
                        <span className="sr-only">
                          {STATUS_LABEL[conversation.status]}
                        </span>
                      </span>
                    </button>
                    <div
                      className="relative shrink-0 self-center pr-1.5 sm:pr-2"
                      ref={menuOpen ? listMenuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setListMenuId((current) =>
                            current === conversation.id
                              ? null
                              : conversation.id,
                          )
                        }
                        className={cn(
                          "inline-flex size-11 touch-manipulation items-center justify-center rounded-chat-cta text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          menuOpen
                            ? "bg-muted text-foreground"
                            : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
                        )}
                        aria-label={`Opțiuni pentru ${listTitle}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                      >
                        <MoreIcon />
                      </button>
                      {menuOpen ? (
                        <div
                          role="menu"
                          className="absolute right-2 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-chat border border-border bg-background py-1 shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setListMenuId(null);
                              setPendingDeleteId(conversation.id);
                            }}
                            className="flex min-h-11 w-full touch-manipulation items-center px-3.5 text-left text-sm text-destructive transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                          >
                            Șterge conversația
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section
          className={cn(
            "chat-panel absolute inset-0 z-20 flex min-w-0 flex-col md:static md:z-auto md:flex md:flex-1",
            panelMotion,
            showChatOnMobile
              ? "max-md:translate-x-0 max-md:visible"
              : "max-md:pointer-events-none max-md:invisible max-md:translate-x-full",
          )}
        >
          {activeConversation ? (
            <>
              <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/70 bg-background/85 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-sm max-md:h-[calc(4rem+env(safe-area-inset-top))] md:px-4 md:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    inputRef.current?.blur();
                    setChatMenuOpen(false);
                    setMobileShowChat(false);
                  }}
                  className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-chat-cta text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                  aria-label="Înapoi la listă"
                >
                  <BackIcon />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ProfileAvatar
                    label={patientName}
                    size="sm"
                    sex={patientSex}
                    className="size-9 border-[2.5px]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight">
                      {patientName}
                    </p>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-chat-cta border px-2 py-0.5 text-[11px] font-medium",
                        statusPillClass(activeConversation.status),
                      )}
                      role="status"
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-chat-cta",
                          statusDotClass(activeConversation.status),
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {STATUS_LABEL[activeConversation.status]}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="relative shrink-0" ref={chatMenuRef}>
                  <button
                    type="button"
                    onClick={() => setChatMenuOpen((open) => !open)}
                    className="inline-flex size-11 touch-manipulation items-center justify-center rounded-chat-cta text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Opțiuni conversație"
                    aria-haspopup="menu"
                    aria-expanded={chatMenuOpen}
                  >
                    <MoreIcon />
                  </button>
                  {chatMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-chat border border-border bg-background py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setChatMenuOpen(false);
                          setPendingDeleteId(activeConversation.id);
                        }}
                        className="flex min-h-11 w-full touch-manipulation items-center px-3.5 text-left text-sm text-destructive transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      >
                        Șterge conversația
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                {activeConversation.messages.some(
                  (message) => message.sender === "patient",
                ) ? (
                  <section className="mb-5 rounded-chat border border-border/70 bg-background/80 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="max-w-xl">
                        <h2 className="text-sm font-semibold">
                          Informații medicale din conversație
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          La cerere, conversația este trimisă către Google
                          Gemini. Nimic nu se salvează în profil fără
                          confirmarea ta.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleExtractMedicalInfo()}
                        disabled={
                          extractingMedicalInfo ||
                          medicalDraftsConversationId !== activeConversation.id
                        }
                        className="inline-flex min-h-10 touch-manipulation items-center justify-center rounded-chat-cta border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50"
                      >
                        {extractingMedicalInfo
                          ? "Se analizează…"
                          : "Extrage informații"}
                      </button>
                    </div>
                    {medicalExtractionMessage ? (
                      <p
                        className="mt-3 text-sm text-muted-foreground"
                        role="status"
                      >
                        {medicalExtractionMessage}
                      </p>
                    ) : null}
                    {visibleMedicalDrafts.map((medicalDraft) => {
                      const selection = medicalSelections[medicalDraft.id] ?? {
                        allergies: [],
                        chronicConditions: [],
                        currentTreatments: [],
                      };
                      const selectedCount =
                        selection.allergies.length +
                        selection.chronicConditions.length +
                        selection.currentTreatments.length;

                      return (
                        <div
                          key={medicalDraft.id}
                          className="mt-4 border-t border-border/70 pt-4"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            Propunere de verificat ·{" "}
                            {new Date(medicalDraft.createdAt).toLocaleString(
                              "ro-RO",
                            )}
                          </p>
                          <div className="mt-3 space-y-4">
                            {MEDICAL_EXTRACTION_CATEGORIES.map((category) => {
                              const facts =
                                medicalDraft.proposedData[category];
                              if (facts.length === 0) {
                                return null;
                              }
                              return (
                                <fieldset key={category} className="space-y-2">
                                  <legend className="text-sm font-medium">
                                    {MEDICAL_EXTRACTION_LABEL[category]}
                                  </legend>
                                  {facts.map((fact, index) => (
                                    <label
                                      key={`${category}-${index}`}
                                      className="flex cursor-pointer gap-2 rounded-chat border border-border/60 p-2.5 text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selection[category].includes(
                                          index,
                                        )}
                                        onChange={() =>
                                          toggleMedicalFact(
                                            medicalDraft.id,
                                            category,
                                            index,
                                          )
                                        }
                                        aria-label={`Salvează ${MEDICAL_EXTRACTION_LABEL[category]}: ${fact.value}`}
                                      />
                                      <span>
                                        <span className="block font-medium">
                                          {fact.value}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                          „{fact.evidence}”
                                        </span>
                                      </span>
                                    </label>
                                  ))}
                                </fieldset>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void reviewMedicalDraft(medicalDraft, "reject")
                              }
                              disabled={reviewingMedicalDraftId != null}
                              className="min-h-10 rounded-chat-cta px-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                            >
                              Respinge
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void reviewMedicalDraft(medicalDraft, "accept")
                              }
                              disabled={
                                selectedCount === 0 ||
                                reviewingMedicalDraftId != null
                              }
                              className="min-h-10 rounded-chat-cta bg-bubble-out px-3 text-sm font-medium text-bubble-out-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {reviewingMedicalDraftId === medicalDraft.id
                                ? "Se salvează…"
                                : "Salvează selecția"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                ) : null}
                {activeConversation.messages.length === 0 ? (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center px-2 py-6 text-center">
                    <EmptyChatMark />
                    <p className="mt-4 text-base font-semibold tracking-tight">
                      Descrie ce te îngrijorează
                    </p>
                    {activeConversation.status !== "closed" ? (
                      <div className="mt-4 flex max-w-sm flex-wrap justify-center gap-2">
                        {EMPTY_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setDraft(prompt);
                              inputRef.current?.focus();
                            }}
                            className="min-h-11 touch-manipulation rounded-chat-cta border border-border/80 bg-bubble-in/80 px-3.5 py-2 text-left text-sm text-bubble-in-foreground/85 transition-colors hover:border-foreground/25 hover:bg-bubble-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <MessageThread
                    messages={activeConversation.messages}
                    waitingForDoctor={
                      activeConversation.status !== "closed" &&
                      activeConversation.messages[
                        activeConversation.messages.length - 1
                      ]?.sender === "patient"
                    }
                  />
                )}
                <div ref={messagesEndRef} />
              </div>

              {activeConversation.status === "closed" ? (
                <div className="shrink-0 border-t border-border/70 bg-background/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
                  Nu mai poți trimite mesaje în această consultație.
                </div>
              ) : (
                <form
                  onSubmit={handleSend}
                  className="shrink-0 border-t border-border/70 bg-background/90 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-4"
                >
                  <div className="flex items-end gap-2">
                    <label className="sr-only" htmlFor="consult-message">
                      Mesaj pentru medic
                    </label>
                    <textarea
                      ref={inputRef}
                      id="consult-message"
                      rows={1}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Mesaj pentru medic…"
                      maxLength={2000}
                      className="max-h-24 min-h-11 flex-1 resize-none overflow-y-auto rounded-chat border border-input bg-bubble-in px-3.5 py-2.5 text-sm leading-5 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="submit"
                      disabled={draft.trim().length === 0 || busy}
                      className="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-chat-cta bg-bubble-out text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 sm:h-11 sm:w-auto sm:px-4"
                      aria-label="Trimite mesajul"
                    >
                      <SendIcon />
                      <span className="hidden sm:inline">Trimite</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div className="max-w-sm space-y-3">
                <p className="text-lg font-semibold tracking-tight">
                  Alege o consultație
                </p>
                <p className="text-sm text-muted-foreground">
                  Selectează o conversație cu medicul din stânga sau creează una
                  nouă pentru {patientName}.
                </p>
                <button
                  type="button"
                  onClick={() => void handleNewChat()}
                  disabled={busy}
                  className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-chat-cta bg-bubble-out px-4 py-2 text-sm font-medium text-bubble-out-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
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

function ListStatusIcon({ status }: { status: ConsultationStatus }) {
  const softClass =
    status === "pending"
      ? "bg-status-wait-soft text-status-wait"
      : status === "in_progress"
        ? "bg-status-live-soft text-status-live"
        : "bg-status-done-soft text-status-done";

  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-chat-cta",
        softClass,
      )}
      aria-hidden="true"
    >
      {status === "closed" ? <ClosedChatIcon /> : <OpenChatIcon />}
    </span>
  );
}

function OpenChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8.5h8.5a3.5 3.5 0 0 1 3.5 3.5v2a3.5 3.5 0 0 1-3.5 3.5H11l-3 2.5V17.5H6A3.5 3.5 0 0 1 2.5 14v-2A3.5 3.5 0 0 1 6 8.5z" />
    </svg>
  );
}

function ClosedChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8.5h8.5a3.5 3.5 0 0 1 3.5 3.5v2a3.5 3.5 0 0 1-3.5 3.5H11l-3 2.5V17.5H6A3.5 3.5 0 0 1 2.5 14v-2A3.5 3.5 0 0 1 6 8.5z" />
      <path d="M9 12.5h5" />
    </svg>
  );
}

function MessageThread({
  messages,
  waitingForDoctor,
}: {
  messages: Array<ChatMessage & { sender: "patient" | "doctor" }>;
  waitingForDoctor: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      {messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : null;
        const day = formatChatDay(message.sentAt);
        const previousDay =
          previous != null ? formatChatDay(previous.sentAt) : null;
        const showDay = day !== previousDay;
        const fromPatient = message.sender === "patient";
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
                fromPatient ? "justify-end" : "justify-start",
                startOfRun ? "mt-3" : "mt-1",
                index === 0 && !showDay && "mt-0",
              )}
            >
              {!fromPatient ? (
                startOfRun ? (
                  <span
                    className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-chat-cta border border-border/70 bg-bubble-in text-[11px] font-semibold tracking-wide text-muted-foreground shadow-sm"
                    aria-hidden="true"
                  >
                    M
                  </span>
                ) : (
                  <span className="size-8 shrink-0" aria-hidden="true" />
                )
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2.5 sm:max-w-[72%]",
                  fromPatient
                    ? "rounded-chat rounded-br-md bg-bubble-out text-bubble-out-foreground"
                    : "rounded-chat rounded-bl-md border border-border/50 bg-bubble-in text-bubble-in-foreground shadow-[0_1px_2px_oklch(0.2_0.02_240/0.06)]",
                )}
              >
                {!fromPatient && startOfRun ? (
                  <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                    Medic
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.text}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-[10px] tabular-nums",
                    fromPatient
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
      {waitingForDoctor ? (
        <p
          className="mt-3 self-end text-xs font-medium text-status-wait-foreground/90"
          role="status"
        >
          Așteaptă răspuns medic…
        </p>
      ) : null}
    </div>
  );
}

function EmptyChatMark() {
  return (
    <span
      className="flex size-16 items-center justify-center rounded-chat border border-border/70 bg-bubble-in/80 text-muted-foreground shadow-sm"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        className="size-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 14h18a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H20l-6 5v-5h-4a6 6 0 0 1-6-6v-6a6 6 0 0 1 6-6z" />
        <path d="M28 10h8a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5h-2l-4 3.5V25" />
      </svg>
    </span>
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

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
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
