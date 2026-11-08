import {
  ACTIVE_PATIENT_STORAGE_KEY,
  activePatientSchema,
} from "@/lib/patient-select";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeActivePatient(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === `KidOS.${ACTIVE_PATIENT_STORAGE_KEY}`
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

export function getActivePatientId(): string | null {
  const saved = readStorage(ACTIVE_PATIENT_STORAGE_KEY, activePatientSchema);
  return saved.ok ? saved.data.profileId : null;
}

export function setActivePatientId(profileId: string | null) {
  if (profileId == null) {
    removeStorage(ACTIVE_PATIENT_STORAGE_KEY);
  } else {
    writeStorage(ACTIVE_PATIENT_STORAGE_KEY, { profileId });
  }
  emit();
}
