"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { PatientPerson } from "@/lib/patient-dashboard/types";
import {
  DemoBadge,
  EmptyNote,
  MetaLine,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  TextButton,
} from "@/components/patient-dashboard/ui";
import { DemoDialog, DialogActions } from "@/components/patient-select/dialog";
import { MemberForm } from "@/components/family-history/member-form";
import { DEMO_FAMILY, DEMO_FAMILY_PROFILE_ID } from "@/lib/family-history/fixtures";
import { buildFamilyRiskSummary } from "@/lib/family-history/summary";
import {
  RELATION_LABEL,
  SINGLE_RELATIONS,
  familyMemberInputSchema,
  type FamilyMember,
  type FamilyMemberInput,
  type FamilyRelation,
} from "@/lib/family-history/types";
import { sexDotClass, sexThemeClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

type Editor =
  | { mode: "slot"; relation: FamilyRelation; member: FamilyMember | null }
  | { mode: "add-sibling" }
  | { mode: "add-extended" }
  | null;

const SIBLINGS: FamilyRelation[] = ["sister", "brother"];
const EXTENDED: FamilyRelation[] = ["maternal_aunt", "maternal_uncle", "paternal_aunt", "paternal_uncle"];
const FORM_ID = "family-member-form";

/** Familia demonstrativă (doar pentru Laura). Datele stau în starea paginii, fără server. */
function initialFamily(profileId: string): FamilyMember[] {
  if (profileId !== DEMO_FAMILY_PROFILE_ID) return [];
  return DEMO_FAMILY.map((input, index) => ({
    ...familyMemberInputSchema.parse(input),
    id: `demo-member-${index + 1}`,
    childProfileId: profileId,
    updatedAt: "2026-11-08T00:00:00.000Z",
  }));
}

export function FamilyHistoryPage({ person }: { person: PatientPerson }) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const profileId = typeof params.id === "string" ? params.id : "";

  const dashboardHref = `/pacient/${profileId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  // Demo fără backend: consimțământul și membrii familiei se păstrează doar cât timp pagina este deschisă.
  const [consent, setConsent] = useState(() => profileId === DEMO_FAMILY_PROFILE_ID);
  const [members, setMembers] = useState<FamilyMember[]>(() => initialFamily(profileId));
  const [editor, setEditor] = useState<Editor>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const summary = useMemo(() => buildFamilyRiskSummary(profileId, members), [profileId, members]);
  const byRelation = (relation: FamilyRelation) => members.find((m) => m.relation === relation) ?? null;

  async function saveMember(input: FamilyMemberInput) {
    const data = familyMemberInputSchema.parse(input);
    const existing = editor?.mode === "slot" ? editor.member : null;
    const saved: FamilyMember = {
      ...data,
      id: existing?.id ?? crypto.randomUUID(),
      childProfileId: profileId,
      updatedAt: new Date().toISOString(),
    };
    setMembers((current) => (existing ? current.map((m) => (m.id === existing.id ? saved : m)) : [...current, saved]));
    setEditor(null);
  }

  function removeMember(member: FamilyMember) {
    setMembers((current) => current.filter((m) => m.id !== member.id));
    setEditor(null);
  }

  function deleteAll() {
    setMembers([]);
    setConsent(false);
    setConfirmDelete(false);
  }

  const siblings = members.filter((m) => SIBLINGS.includes(m.relation));
  const maternalExtended = members.filter((m) => m.relation === "maternal_aunt" || m.relation === "maternal_uncle");
  const paternalExtended = members.filter((m) => m.relation === "paternal_aunt" || m.relation === "paternal_uncle");

  const slot = (relation: FamilyRelation) => (
    <MemberNode
      key={relation}
      relation={relation}
      member={byRelation(relation)}
      onOpen={() => setEditor({ mode: "slot", relation, member: byRelation(relation) })}
    />
  );
  const extraNode = (member: FamilyMember) => (
    <MemberNode
      key={member.id}
      relation={member.relation}
      member={member}
      onOpen={() => setEditor({ mode: "slot", relation: member.relation, member })}
    />
  );

  const editorMember = editor?.mode === "slot" ? editor.member : null;
  const editorTitle =
    editor?.mode === "slot"
      ? RELATION_LABEL[editor.relation]
      : editor?.mode === "add-sibling"
        ? "Adaugă frate sau soră"
        : "Adaugă unchi sau mătușă";

  return (
    <div
      className={cn(
        "min-h-dvh bg-background text-foreground",
        sexThemeClass(person.sex),
      )}
    >
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <Link
              href={dashboardHref}
              className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Înapoi
            </Link>
            <div className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
            <p className="flex min-w-0 items-center gap-2 truncate text-sm">
              <span className={sexDotClass(person.sex)} aria-hidden="true" />
              <span className="truncate">
                <span className="font-semibold tracking-[0.14em] text-foreground/70 uppercase">KidOS</span>
                <span className="text-muted-foreground"> · Istoric familial · </span>
                <span className="font-medium">{person.firstName}</span>
              </span>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <DemoBadge />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Istoric medical familial</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Bolile din familie ajută medicul și asistentul de triaj să evalueze mai bine simptomele copilului.
              Completați doar ce știți.
            </p>
          </div>
          {consent ? (
            <div className="flex flex-wrap gap-2">
              <SecondaryButton onClick={() => setEditor({ mode: "add-sibling" })}>Adaugă frate / soră</SecondaryButton>
              <SecondaryButton onClick={() => setEditor({ mode: "add-extended" })}>Adaugă unchi / mătușă</SecondaryButton>
            </div>
          ) : null}
        </div>

        {!consent ? (
          <ConsentCard childName={person.firstName} onAccept={() => setConsent(true)} />
        ) : (
          <>
            <SectionCard title="Arbore genealogic" emphasized>
              <div className="overflow-x-auto pb-2">
                <div className="mx-auto flex min-w-[44rem] flex-col items-stretch">
                  <Generation label="Bunici">
                    <Branch>{[slot("maternal_grandmother"), slot("maternal_grandfather")]}</Branch>
                    <Branch>{[slot("paternal_grandmother"), slot("paternal_grandfather")]}</Branch>
                  </Generation>
                  <Connector />
                  <Generation label="Părinți">
                    <Branch>
                      {maternalExtended.map(extraNode)}
                      {slot("mother")}
                    </Branch>
                    <Branch>
                      {slot("father")}
                      {paternalExtended.map(extraNode)}
                    </Branch>
                  </Generation>
                  <Connector />
                  <Generation label="Copii">
                    <div className="flex flex-wrap justify-center gap-3">
                      <div className="w-40 rounded-xl border-2 border-foreground bg-foreground p-3 text-background">
                        <p className="text-xs opacity-70">Copilul</p>
                        <p className="truncate font-semibold">{person.firstName}</p>
                      </div>
                      {siblings.map(extraNode)}
                    </div>
                  </Generation>
                </div>
              </div>
              <MetaLine>Atingeți un card pentru a-l completa sau modifica. Locurile goale sunt marcate „Necompletat”.</MetaLine>
            </SectionCard>

            <SectionCard title="Factori de risc familiali identificați">
              {summary.factors.length === 0 ? (
                <EmptyNote>Nu au fost declarate afecțiuni în familie.</EmptyNote>
              ) : (
                <ul className="space-y-2 text-sm">
                  {summary.factors.map((factor) => (
                    <li key={`${factor.code}-${factor.label}`} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                      <span>{factor.sentence}</span>
                    </li>
                  ))}
                </ul>
              )}
              {summary.membersUnknown > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Istoric necunoscut pentru{" "}
                  {summary.membersUnknown === 1 ? "un membru al familiei" : `${summary.membersUnknown} membri ai familiei`}.
                </p>
              ) : null}
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Rezumatul reflectă doar informațiile declarate și nu reprezintă o evaluare medicală.
              </p>
            </SectionCard>

            <SectionCard title="Datele dumneavoastră">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Puteți șterge oricând tot istoricul familial al lui {person.firstName}. Ștergerea retrage și consimțământul.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-4 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Șterge istoricul familial
              </button>
            </SectionCard>
          </>
        )}
      </main>

      <DemoDialog
        open={editor != null}
        title={editorTitle}
        description="Toate câmpurile, în afară de relație, sunt opționale."
        onClose={() => setEditor(null)}
        size="lg"
      >
        {editor ? (
          <>
            <MemberForm
              key={editorMember?.id ?? (editor.mode === "slot" ? editor.relation : editor.mode)}
              formId={FORM_ID}
              initial={editorMember}
              relation={editor.mode === "slot" ? editor.relation : null}
              allowedRelations={editor.mode === "add-sibling" ? SIBLINGS : editor.mode === "add-extended" ? EXTENDED : []}
              onSubmit={saveMember}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {editorMember ? (
                <TextButton onClick={() => removeMember(editorMember)} className="text-destructive">
                  {SINGLE_RELATIONS.includes(editorMember.relation) ? "Golește acest loc" : "Elimină din arbore"}
                </TextButton>
              ) : (
                <span />
              )}
              <DialogActions onCancel={() => setEditor(null)} confirmLabel="Salvează" formId={FORM_ID} />
            </div>
          </>
        ) : null}
      </DemoDialog>

      <DemoDialog
        open={confirmDelete}
        title="Ștergeți istoricul familial?"
        description={`Toți membrii familiei și afecțiunile lor vor fi șterși pentru ${person.firstName}. Consimțământul va fi retras.`}
        onClose={() => setConfirmDelete(false)}
      >
        <DialogActions onCancel={() => setConfirmDelete(false)} onConfirm={deleteAll} confirmLabel="Șterge definitiv" />
      </DemoDialog>
    </div>
  );
}

/** Consimțământ explicit înainte de prima completare (date privind sănătatea – GDPR art. 9). */
function ConsentCard({ childName, onAccept }: { childName: string; onAccept: () => void }) {
  const checkboxId = useId();
  const [checked, setChecked] = useState(false);

  return (
    <SectionCard title="Înainte de a începe" emphasized className="max-w-3xl">
      <div className="space-y-5 text-sm leading-relaxed">
        <div>
          <h3 className="mb-1 font-medium">De ce cerem aceste informații</h3>
          <p className="text-muted-foreground">
            Unele afecțiuni (astm, alergii, diabet, epilepsie, boli genetice) apar mai des când există și la rude apropiate.
            Rezumatul istoricului familial al lui {childName} oferă context pentru triajul AI și pentru medic. Nu este
            folosit pentru diagnostic.
          </p>
        </div>
        <div>
          <h3 className="mb-1 font-medium">Ce date se completează</h3>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>Relația rudei cu copilul, prenumele și anul nașterii (opționale)</li>
            <li>Dacă ruda este în viață; în caz de deces, vârsta și cauza (opțional)</li>
            <li>Afecțiunile cunoscute, vârsta la debut și note</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-1 font-medium">Drepturile dumneavoastră</h3>
          <p className="text-muted-foreground">
            Datele privind sănătatea sunt date cu caracter special. Le puteți șterge oricând din această pagină.
            Consimțământul este opțional; restul aplicației funcționează și fără el.
          </p>
        </div>
        <label htmlFor={checkboxId} className="flex items-start gap-3 rounded-xl border border-border p-4">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5 size-4 accent-foreground"
          />
          <span>
            Sunt de acord ca KidOS să prelucreze datele de sănătate ale familiei, introduse de mine, pentru a oferi context
            medical pentru {childName}.
          </span>
        </label>
        <PrimaryButton
          onClick={() => {
            if (checked) onAccept();
          }}
          className={checked ? undefined : "pointer-events-none opacity-40"}
        >
          Sunt de acord și continui
        </PrimaryButton>
      </div>
    </SectionCard>
  );
}

function Generation({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap justify-center gap-6">{children}</div>
    </div>
  );
}

function Branch({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-center gap-3 rounded-2xl border border-dashed border-border p-2">{children}</div>;
}

function Connector() {
  return <div aria-hidden="true" className="mx-auto h-6 w-px bg-border" />;
}

function conditionsSummary(member: FamilyMember): string {
  if (member.conditionsStatus === "unknown") return "Istoric necunoscut";
  if (member.conditionsStatus === "none" || member.conditions.length === 0) return "Fără afecțiuni cunoscute";
  return member.conditions.length === 1 ? "1 afecțiune" : `${member.conditions.length} afecțiuni`;
}

function MemberNode({
  relation,
  member,
  onOpen,
}: {
  relation: FamilyRelation;
  member: FamilyMember | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-40 rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        member ? "border-border bg-background hover:bg-muted/60" : "border-dashed border-border text-muted-foreground hover:bg-muted/40",
      )}
    >
      <p className="truncate text-xs text-muted-foreground">{RELATION_LABEL[relation]}</p>
      {member ? (
        <>
          <p className="truncate font-semibold">{member.displayName ?? RELATION_LABEL[relation]}</p>
          <p className="mt-1 text-xs">
            {member.vitalStatus === "deceased"
              ? `Decedat(ă)${member.ageAtDeath != null ? ` la ${member.ageAtDeath} ani` : ""}`
              : "În viață"}
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              member.conditionsStatus === "known" && member.conditions.length > 0 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {conditionsSummary(member)}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm font-medium">+ Necompletat</p>
      )}
    </button>
  );
}
