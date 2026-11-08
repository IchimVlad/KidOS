import {
  CONSULTATIONS_STORAGE_KEY,
  consultationsStoreSchema,
  type ChatMessage,
  type ConsultationStatus,
  type Conversation,
  type ConsultationsStore,
} from "@/lib/consultations/types";
import { readStorage, writeStorage } from "@/lib/storage";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function emptyStore(): ConsultationsStore {
  return { conversations: [] };
}

export function subscribeConsultations(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === `KidOS.${CONSULTATIONS_STORAGE_KEY}`
    ) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getConsultationsStore(): ConsultationsStore {
  const saved = readStorage(
    CONSULTATIONS_STORAGE_KEY,
    consultationsStoreSchema,
  );
  return saved.ok ? saved.data : emptyStore();
}

function saveStore(store: ConsultationsStore) {
  writeStorage(CONSULTATIONS_STORAGE_KEY, store);
  emit();
}

export function listConversationsForPatient(patientId: string): Conversation[] {
  return getConsultationsStore()
    .conversations.filter((conversation) => conversation.patientId === patientId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getConversation(conversationId: string): Conversation | null {
  return (
    getConsultationsStore().conversations.find(
      (conversation) => conversation.id === conversationId,
    ) ?? null
  );
}

export function createConversation(input: {
  patientId: string;
  patientName: string;
}): Conversation {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `conv_${crypto.randomUUID()}`,
    patientId: input.patientId,
    patientName: input.patientName,
    title: `Consultație · ${formatShortTime(now)}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  const store = getConsultationsStore();
  saveStore({
    conversations: [conversation, ...store.conversations],
  });

  return conversation;
}

export function appendMessage(
  conversationId: string,
  text: string,
): Conversation | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const store = getConsultationsStore();
  const index = store.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  );
  if (index < 0) {
    return null;
  }

  const now = new Date().toISOString();
  const message: ChatMessage = {
    id: `msg_${crypto.randomUUID()}`,
    text: trimmed.slice(0, 2000),
    sentAt: now,
    sender: "patient",
    delivery: "pending",
  };

  const current = store.conversations[index];
  const updated: Conversation = {
    ...current,
    updatedAt: now,
    status: current.status === "closed" ? "pending" : current.status,
    messages: [...current.messages, message],
  };

  const conversations = store.conversations.slice();
  conversations[index] = updated;
  saveStore({ conversations });
  return updated;
}

export function setConversationStatus(
  conversationId: string,
  status: ConsultationStatus,
): Conversation | null {
  const store = getConsultationsStore();
  const index = store.conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  );
  if (index < 0) {
    return null;
  }

  const updated: Conversation = {
    ...store.conversations[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  const conversations = store.conversations.slice();
  conversations[index] = updated;
  saveStore({ conversations });
  return updated;
}

function formatShortTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "nouă";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
