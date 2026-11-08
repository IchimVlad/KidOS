"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import { DemoDialog, DialogActions } from "@/components/patient-select/dialog";
import {
  getActivePatientId,
  setActivePatientId,
  subscribeActivePatient,
} from "@/lib/active-patient";
import {
  DEMO_PROFILES,
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

function profileHref(profile: PatientProfile): string {
  const params = new URLSearchParams({
    nume: profile.firstName,
    relatie: profile.relation,
    sex: profile.sex,
  });
  return `/pacient/${profile.id}?${params.toString()}`;
}

export function PatientSelectPage() {
  const addFormId = useId();
  const [profiles, setProfiles] = useState<PatientProfile[]>(DEMO_PROFILES);
  const selectedId = useSyncExternalStore(
    subscribeActivePatient,
    getActivePatientId,
    () => null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [draftName, setDraftName] = useState("");
  const [draftRelation, setDraftRelation] =
    useState<PatientRelation>("child");
  const [draftSex, setDraftSex] = useState<PatientSex>("female");

  function closeDialog() {
    setDialog(null);
    setDraftName("");
    setDraftRelation("child");
    setDraftSex("female");
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstName = draftName.trim();
    if (firstName.length === 0) {
      return;
    }

    const profile: PatientProfile = {
      id: `profile_${crypto.randomUUID()}`,
      firstName,
      relation: draftRelation,
      sex: draftSex,
    };

    setProfiles((current) => [...current, profile]);
    setNotice(
      `${firstName} a fost adăugat(ă) demonstrativ. Adăugarea nu acordă acces la date medicale reale.`,
    );
    closeDialog();
  }

  function removeProfile(profileId: string) {
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
    if (selectedId === profileId) {
      setActivePatientId(null);
      setNotice("Profilul selectat a fost eliminat din demonstrație.");
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-y-auto bg-background text-foreground">
      <header className="px-6 pt-8 sm:px-10 sm:pt-10">
        <p className="text-sm font-semibold tracking-[0.18em] text-foreground/70 uppercase">
          KidOS
        </p>
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
                    href={profileHref(profile)}
                    onClick={() => setActivePatientId(profile.id)}
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
        description="Date demonstrative. Adăugarea unui adult nu acordă acces la datele sale medicale."
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
            disabled={draftName.trim().length === 0}
          />
        </form>
      </DemoDialog>

      <DemoDialog
        open={dialog === "manage"}
        title="Gestionează profilurile"
        description="Poți elimina profiluri doar din această demonstrație. Nu există date medicale asociate."
        onClose={closeDialog}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-medium">
                  <span className={sexDotClass(profile.sex)} aria-hidden="true" />
                  {profile.firstName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {RELATION_LABEL[profile.relation]} · {SEX_LABEL[profile.sex]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeProfile(profile.id)}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </DemoDialog>
    </div>
  );
}
