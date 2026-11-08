"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import { DemoDialog, DialogActions } from "@/components/patient-select/dialog";
import {
  RELATION_LABEL,
  SEX_LABEL,
  patientRelationSchema,
  patientSexSchema,
  type PatientProfile,
  type PatientRelation,
  type PatientSex,
} from "@/lib/patient-select";
import { sexDotClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

type DialogKind = "add" | "manage" | null;

export function PatientSelectPage({
  initialProfiles,
}: {
  initialProfiles: PatientProfile[];
}) {
  const router = useRouter();
  const addFormId = useId();
  const [profiles, setProfiles] = useState<PatientProfile[]>(initialProfiles);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [profileToDelete, setProfileToDelete] =
    useState<PatientProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftRelation, setDraftRelation] =
    useState<PatientRelation>("child");
  const [draftSex, setDraftSex] = useState<PatientSex>("female");
  const [draftDateOfBirth, setDraftDateOfBirth] = useState("");

  const today = new Date();
  const maxDateOfBirth = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 10);

  function closeDialog() {
    setDialog(null);
    setProfileToDelete(null);
    setDeleteError(null);
    setDraftName("");
    setDraftRelation("child");
    setDraftSex("female");
    setDraftDateOfBirth("");
  }

  function cancelProfileDeletion() {
    setProfileToDelete(null);
    setDeleteError(null);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstName = draftName.trim();
    if (firstName.length === 0 || draftDateOfBirth.length === 0 || pending) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          relation: draftRelation,
          sex: draftSex,
          dateOfBirth: draftDateOfBirth,
        }),
      });
      if (!response.ok) {
        setNotice("Profilul nu a putut fi adăugat.");
        return;
      }
      const payload = (await response.json()) as { profile: PatientProfile };
      setProfiles((current) => [...current, payload.profile]);
      setNotice(`${firstName} a fost adăugat(ă).`);
      closeDialog();
      router.refresh();
    } catch {
      setNotice("Profilul nu a putut fi adăugat.");
    } finally {
      setPending(false);
    }
  }

  async function removeProfile() {
    if (pending || !profileToDelete) {
      return;
    }
    setDeleteError(null);
    setPending(true);
    try {
      const response = await fetch("/api/profiles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profileToDelete.id }),
      });
      if (!response.ok) {
        setDeleteError("Profilul nu a putut fi eliminat. Încearcă din nou.");
        return;
      }
      setProfiles((current) =>
        current.filter((profile) => profile.id !== profileToDelete.id),
      );
      setProfileToDelete(null);
      setDialog("manage");
      router.refresh();
    } catch {
      setDeleteError("Profilul nu a putut fi eliminat. Verifică conexiunea și încearcă din nou.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-y-auto bg-background text-foreground">
      <header className="px-6 pt-8 sm:px-10 sm:pt-10">
        <div className="flex items-center gap-2">
          <img
            src="/kidos-logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7"
          />
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Kidos
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10 sm:gap-14">
          <h1 className="max-w-xl text-center text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Pentru cine ai nevoie de ajutor?
          </h1>

          <ul
            className="grid w-full grid-cols-2 justify-items-center gap-x-6 gap-y-10 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-14 sm:gap-y-12"
            aria-label="Profiluri disponibile"
          >
            {profiles.map((profile) => {
              return (
                <li key={profile.id} className="w-full max-w-36 sm:w-auto">
                  <Link
                    href={`/pacient/${profile.id}`}
                    aria-label={`${profile.firstName}, ${RELATION_LABEL[profile.relation]}, ${SEX_LABEL[profile.sex]}`}
                    className={cn(
                      "group flex w-full flex-col items-center gap-4 rounded-3xl p-3 text-center transition-[transform,background-color] duration-200 ease-out",
                      "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
                    )}
                  >
                    <ProfileAvatar
                      label={profile.firstName}
                      sex={profile.sex}
                      className="group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                    />
                    <span className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
                      <span className={sexDotClass(profile.sex)} aria-hidden="true" />
                      {profile.firstName}
                    </span>
                    <span className="sr-only">
                      {RELATION_LABEL[profile.relation]}, {SEX_LABEL[profile.sex]}
                    </span>
                  </Link>
                </li>
              );
            })}

            <li className="w-full max-w-36 sm:w-auto">
              <button
                type="button"
                onClick={() => setDialog("add")}
                aria-label="Adaugă o persoană"
                className="group flex w-full flex-col items-center gap-4 rounded-3xl p-3 text-center transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
              >
                <ProfileAvatar
                  label="Adaugă"
                  tone="add"
                  className="group-hover:border-foreground/60 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                />
                <span className="text-lg font-semibold tracking-tight text-foreground/80 sm:text-xl">
                  Adaugă o persoană
                </span>
              </button>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setDialog("manage")}
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Gestionează profilurile
          </button>

          <p
            role="status"
            aria-live="polite"
            className={cn(
              "min-h-12 max-w-md text-center text-sm leading-relaxed text-muted-foreground transition-opacity duration-200",
              notice ? "opacity-100" : "opacity-0",
            )}
          >
            {notice ?? " "}
          </p>
        </div>
      </main>

      <DemoDialog
        open={dialog === "add"}
        title="Adaugă o persoană"
        description="Profilul este salvat în baza de date a spațiului familiei."
        onClose={closeDialog}
      >
        <form id={addFormId} className="space-y-4" onSubmit={handleAdd}>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Prenume</span>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              name="firstName"
              autoComplete="off"
              maxLength={40}
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium">Data nașterii</span>
            <input
              type="date"
              value={draftDateOfBirth}
              onChange={(event) => setDraftDateOfBirth(event.target.value)}
              name="dateOfBirth"
              max={maxDateOfBirth}
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="block text-xs leading-relaxed text-muted-foreground">
              Vârsta profilului va fi calculată automat din această dată.
            </span>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Pentru cine</legend>
            <div className="grid gap-2">
              {(Object.keys(RELATION_LABEL) as PatientRelation[]).map(
                (relation) => (
                  <label
                    key={relation}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted has-[:checked]:border-border has-[:checked]:bg-muted"
                  >
                    <input
                      type="radio"
                      name="relation"
                      value={relation}
                      checked={draftRelation === relation}
                      onChange={() => {
                        const parsed = patientRelationSchema.safeParse(relation);
                        if (parsed.success) {
                          setDraftRelation(parsed.data);
                        }
                      }}
                      className="size-4 accent-foreground"
                    />
                    {RELATION_LABEL[relation]}
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sex</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SEX_LABEL) as PatientSex[]).map((sex) => (
                <label
                  key={sex}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted has-[:checked]:border-border has-[:checked]:bg-muted"
                >
                  <input
                    type="radio"
                    name="sex"
                    value={sex}
                    checked={draftSex === sex}
                    onChange={() => {
                      const parsed = patientSexSchema.safeParse(sex);
                      if (parsed.success) {
                        setDraftSex(parsed.data);
                      }
                    }}
                    className="size-4 accent-foreground"
                  />
                  <span className={sexDotClass(sex)} aria-hidden="true" />
                  {SEX_LABEL[sex]}
                </label>
              ))}
            </div>
          </fieldset>

          <DialogActions
            formId={addFormId}
            onCancel={closeDialog}
            confirmLabel="Adaugă"
            disabled={
              draftName.trim().length === 0 ||
              draftDateOfBirth.length === 0 ||
              pending
            }
          />
        </form>
      </DemoDialog>

      <DemoDialog
        open={dialog === "manage"}
        size={profileToDelete ? "md" : "sm"}
        centered={Boolean(profileToDelete)}
        title={
          profileToDelete
            ? "Confirmi ștergerea profilului?"
            : "Gestionează profilurile"
        }
        description={
          profileToDelete
            ? `Profilul ${profileToDelete.firstName} și toate informațiile asociate vor fi șterse definitiv.`
            : "Eliminarea șterge profilul și datele medicale asociate din baza de date."
        }
        onClose={closeDialog}
      >
        {profileToDelete ? (
          <>
            <div className="space-y-4 text-center">
              <div
                className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-7"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.5-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                Se vor șterge definitiv datele medicale, istoricul,
                măsurătorile, documentele, rețetele, consultațiile și
                conversațiile acestui profil. Acțiunea nu poate fi anulată.
              </p>
            </div>
            {deleteError ? (
              <p role="alert" className="text-center text-sm text-destructive">
                {deleteError}
              </p>
            ) : null}
            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={cancelProfileDeletion}
                disabled={pending}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Păstrează profilul
              </button>
              <button
                type="button"
                onClick={removeProfile}
                disabled={pending || !profileToDelete}
                className="rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "Se șterge..." : "Da, șterge definitiv"}
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {profiles.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      <span
                        className={sexDotClass(profile.sex)}
                        aria-hidden="true"
                      />
                      {profile.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {RELATION_LABEL[profile.relation]} ·{" "}
                      {SEX_LABEL[profile.sex]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotice(null);
                      setDeleteError(null);
                      setProfileToDelete(profile);
                    }}
                    disabled={pending}
                    className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    Elimină
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Gata
              </button>
            </div>
          </>
        )}
      </DemoDialog>
    </div>
  );
}
