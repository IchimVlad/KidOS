import type { output, ZodType } from "zod";

export const STORAGE_KEY_PREFIX = "KidOS.";

export type StorageFailureReason =
  | "unavailable"
  | "missing"
  | "invalid-json"
  | "validation"
  | "write-error";

export type StorageReadResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: Exclude<StorageFailureReason, "write-error">;
    };

export type StorageMutationResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "write-error" };

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    if (
      storage == null ||
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function" ||
      typeof storage.removeItem !== "function"
    ) {
      return null;
    }

    return storage;
  } catch {
    return null;
  }
}

function toStorageKey(key: string): string {
  if (key.startsWith(STORAGE_KEY_PREFIX)) {
    return key;
  }

  return `${STORAGE_KEY_PREFIX}${key}`;
}

export function readStorage<TSchema extends ZodType>(
  key: string,
  schema: TSchema,
): StorageReadResult<output<TSchema>> {
  const storage = getBrowserStorage();
  if (storage == null) {
    return { ok: false, reason: "unavailable" };
  }

  const storageKey = toStorageKey(key);
  let raw: string | null;

  try {
    raw = storage.getItem(storageKey);
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (raw == null) {
    return { ok: false, reason: "missing" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: "validation" };
  }

  return { ok: true, data: result.data };
}

export function writeStorage(
  key: string,
  value: unknown,
): StorageMutationResult {
  const storage = getBrowserStorage();
  if (storage == null) {
    return { ok: false, reason: "unavailable" };
  }

  let serialized: string;
  try {
    const json = JSON.stringify(value);
    if (typeof json !== "string") {
      return { ok: false, reason: "write-error" };
    }
    serialized = json;
  } catch {
    return { ok: false, reason: "write-error" };
  }

  try {
    storage.setItem(toStorageKey(key), serialized);
  } catch {
    return { ok: false, reason: "write-error" };
  }

  return { ok: true };
}

export function removeStorage(key: string): StorageMutationResult {
  const storage = getBrowserStorage();
  if (storage == null) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    storage.removeItem(toStorageKey(key));
  } catch {
    return { ok: false, reason: "write-error" };
  }

  return { ok: true };
}
