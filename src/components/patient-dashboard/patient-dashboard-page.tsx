"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import { DemoDialog } from "@/components/patient-select/dialog";
import {
  DemoBadge,
  EmptyNote,
  FilterChips,
  MetaLine,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  TextButton,
} from "@/components/patient-dashboard/ui";
import { setActivePatientId } from "@/lib/active-patient";
import { createConversation } from "@/lib/consultations/store";
import { getPatientDashboard } from "@/lib/patient-dashboard/fixtures";
import {
  DOCUMENT_FILTERS,
  DOCUMENT_TYPE_LABEL,
  EVENT_TYPE_LABEL,
  TIMELINE_FILTERS,
  displayValue,
  formatDemoDate,
  matchesTimelineFilter,
  sourceLabel,
} from "@/lib/patient-dashboard/labels";
import type {
  DocumentType,
  MedicalDocument,
  Prescription,
  TimelineEvent,
  TimelineFilter,
} from "@/lib/patient-dashboard/types";
import {
  RELATION_LABEL,
  SEX_LABEL,
  patientRelationSchema,
  patientSexSchema,
  type PatientRelation,
  type PatientSex,
} from "@/lib/patient-select";
import { sexCardClass, sexDotClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

type Panel =
  | { kind: "edit-profile" }
  | { kind: "event"; event: TimelineEvent }
  | { kind: "document"; document: MedicalDocument }
  | { kind: "prescription"; prescription: Prescription }
  | { kind: "ask" }
  | null;

function resolveRelation(raw: string | null): PatientRelation {
  const parsed = patientRelationSchema.safeParse(raw);
  return parsed.success ? parsed.data : "self";
}

function resolveSex(raw: string | null): PatientSex {
  const parsed = patientSexSchema.safeParse(raw);
  return parsed.success ? parsed.data : "female";
}

export function PatientDashboardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const profileId = typeof params.id === "string" ? params.id : "";

  const dashboard = useMemo(() => {
    if (profileId.length === 0) {
      return getPatientDashboard("profile_andi");
    }
    const firstName = searchParams.get("nume") ?? undefined;
    const relation = resolveRelation(searchParams.get("relatie"));
    const sex = resolveSex(searchParams.get("sex"));
    return getPatientDashboard(profileId, firstName, relation, sex);
  }, [profileId, searchParams]);

  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [documentFilter, setDocumentFilter] = useState<DocumentType | "all">(
    "all",
  );
  const [panel, setPanel] = useState<Panel>(null);

  useEffect(() => {
    if (profileId.startsWith("profile_")) {
      setActivePatientId(profileId);
    }
  }, [profileId]);

  const documentsById = useMemo(() => {
    return new Map(dashboard.documents.map((document) => [document.id, document]));
  }, [dashboard.documents]);

  const prescriptionsById = useMemo(() => {
    return new Map(
      dashboard.prescriptions.map((prescription) => [
        prescription.id,
        prescription,
      ]),
    );
  }, [dashboard.prescriptions]);

  const filteredEvents = useMemo(() => {
    return dashboard.events
      .filter((event) => matchesTimelineFilter(event.type, timelineFilter))
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dashboard.events, timelineFilter]);

  const filteredDocuments = useMemo(() => {
    return dashboard.documents
      .filter((document) =>
        documentFilter === "all" ? true : document.type === documentFilter,
      )
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dashboard.documents, documentFilter]);

  const sortedPrescriptions = useMemo(() => {
    return dashboard.prescriptions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dashboard.prescriptions]);

  function openEvent(event: TimelineEvent) {
    setPanel({ kind: "event", event });
  }

  function openDocument(document: MedicalDocument) {
    setPanel({ kind: "document", document });
  }

  function openPrescription(prescription: Prescription) {
    setPanel({ kind: "prescription", prescription });
  }

  function closePanel() {
    setPanel(null);
  }

  const eventDocuments =
    panel?.kind === "event"
      ? panel.event.documentIds
          .map((id) => documentsById.get(id))
          .filter((item): item is MedicalDocument => item != null)
      : [];

  const eventPrescriptions =
    panel?.kind === "event"
      ? panel.event.prescriptionIds
          .map((id) => prescriptionsById.get(id))
          .filter((item): item is Prescription => item != null)
      : [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="shrink-0 text-sm font-semibold tracking-[0.18em] text-foreground/70 uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              KidOS
            </Link>
            <div className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
            <p className="flex min-w-0 items-center gap-2 truncate text-sm text-foreground">
              <span className={sexDotClass(dashboard.person.sex)} aria-hidden="true" />
              <span className="truncate">
                <span className="text-muted-foreground">Pacient activ · </span>
                <span className="font-medium">{dashboard.person.firstName}</span>
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:inline"
            >
              Schimbă persoana
            </Link>
            <SecondaryButton
              onClick={() => setPanel({ kind: "ask" })}
              className="px-3 py-2 text-xs sm:px-4 sm:text-sm"
            >
              Întreabă KidOS
            </SecondaryButton>
            <PrimaryButton
              onClick={() => {
                setActivePatientId(dashboard.person.id);
                const created = createConversation({
                  patientId: dashboard.person.id,
                  patientName: dashboard.person.firstName,
                });
                const query = new URLSearchParams(searchParams.toString());
                query.set("chat", created.id);
                router.push(
                  `/pacient/${dashboard.person.id}/consultatii?${query.toString()}`,
                );
              }}
              className="px-3 py-2 text-xs sm:px-5 sm:text-sm"
            >
              Solicită consultație
            </PrimaryButton>
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pb-3 sm:hidden sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Schimbă persoana
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <DemoBadge />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,38%)_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-6 md:row-start-1">
            <SectionCard
              title="Profil"
              className={sexCardClass(dashboard.person.sex)}
              action={
                <TextButton onClick={() => setPanel({ kind: "edit-profile" })}>
                  Editează profilul
                </TextButton>
              }
            >
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  label={dashboard.person.firstName}
                  size="md"
                  sex={dashboard.person.sex}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-xl font-semibold tracking-tight">
                    <span
                      className={sexDotClass(dashboard.person.sex)}
                      aria-hidden="true"
                    />
                    {dashboard.person.firstName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.person.ageLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {RELATION_LABEL[dashboard.person.relation]} ·{" "}
                    {SEX_LABEL[dashboard.person.sex]}
                  </p>
                </div>
              </div>
            </SectionCard>

            {dashboard.activeConsultation ? (
              <SectionCard title="Consultație activă" className="md:hidden">
                <p className="font-medium">{dashboard.activeConsultation.title}</p>
                <MetaLine>{dashboard.activeConsultation.statusLabel}</MetaLine>
                <div className="mt-3">
                  <TextButton
                    onClick={() => {
                      const event = dashboard.events.find(
                        (item) => item.id === dashboard.activeConsultation?.id,
                      );
                      if (event) {
                        openEvent(event);
                      }
                    }}
                  >
                    Vezi în timeline
                  </TextButton>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard
              title="Sumar de sănătate"
              className={cn(
                dashboard.person.sex === "female" && "border-sex-female/25",
                dashboard.person.sex === "male" && "border-sex-male/25",
              )}
            >
              <div className="space-y-5">
                <SummaryBlock
                  title="Alergii"
                  items={dashboard.health.allergies.map((item) => ({
                    text: displayValue(item.text),
                    source: sourceLabel(item.source),
                  }))}
                />
                <SummaryBlock
                  title="Afecțiuni cunoscute"
                  items={dashboard.health.conditions.map((item) => ({
                    text: displayValue(item.text),
                    source: sourceLabel(item.source),
                  }))}
                />
                <SummaryBlock
                  title="Tratamente curente"
                  items={dashboard.health.currentTreatments.map((item) => ({
                    text: displayValue(item.text),
                    source: sourceLabel(item.source),
                  }))}
                />
                <div>
                  <h3 className="mb-2 text-sm font-medium">Ultimele măsurători</h3>
                  <ul className="space-y-3">
                    {dashboard.health.measurements.map((measurement) => (
                      <li key={measurement.id} className="text-sm">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium">{measurement.label}</span>
                          <span>
                            {measurement.value == null
                              ? "Nespecificat"
                              : `${measurement.value}${measurement.unit ? ` ${measurement.unit}` : ""}`}
                          </span>
                        </div>
                        <MetaLine>
                          {formatDemoDate(measurement.recordedAt)}
                          {sourceLabel(measurement.source)
                            ? ` · ${sourceLabel(measurement.source)}`
                            : ""}
                        </MetaLine>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            <div className="hidden md:block">
              <CoverageCard dashboard={dashboard} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-6 md:row-start-1 md:h-0 md:min-h-full md:overflow-hidden">
            {dashboard.activeConsultation ? (
              <SectionCard
                title="Consultație activă"
                className="hidden shrink-0 md:block"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {dashboard.activeConsultation.title}
                    </p>
                    <MetaLine>{dashboard.activeConsultation.statusLabel}</MetaLine>
                  </div>
                  <TextButton
                    onClick={() => {
                      const event = dashboard.events.find(
                        (item) => item.id === dashboard.activeConsultation?.id,
                      );
                      if (event) {
                        openEvent(event);
                      }
                    }}
                  >
                    Deschide evenimentul
                  </TextButton>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard
              title="Timeline medical"
              emphasized
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              bodyClassName="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden"
              action={
                <span className="text-xs text-muted-foreground">
                  Cele mai recente primele
                </span>
              }
            >
              <div className="shrink-0">
                <FilterChips
                  label="Filtre timeline"
                  options={TIMELINE_FILTERS}
                  value={timelineFilter}
                  onChange={setTimelineFilter}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                {filteredEvents.length === 0 ? (
                  <EmptyNote>
                    Nu există evenimente pentru acest filtru în demonstrație.
                  </EmptyNote>
                ) : (
                  <ol className="relative space-y-0 border-l border-border pl-6">
                    {filteredEvents.map((event, index) => (
                      <li key={event.id} className="relative pb-8 last:pb-0">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-1.5 -left-[1.91rem] size-3 rounded-full border-2 border-background bg-foreground",
                            index === 0 && "ring-4 ring-foreground/10",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => openEvent(event)}
                          className="w-full rounded-xl p-3 text-left transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <time
                              dateTime={event.date}
                              className="text-xs font-medium text-muted-foreground"
                            >
                              {formatDemoDate(event.date)}
                            </time>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                              {EVENT_TYPE_LABEL[event.type]}
                            </span>
                            {event.hasAttachment ? (
                              <span className="text-xs text-muted-foreground">
                                Atașament
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 font-semibold tracking-tight">
                            {event.title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {event.summary}
                          </p>
                          <MetaLine>{event.source}</MetaLine>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Documente medicale">
            <div className="mb-4">
              <FilterChips
                label="Filtre documente"
                options={DOCUMENT_FILTERS}
                value={documentFilter}
                onChange={setDocumentFilter}
              />
            </div>
            {filteredDocuments.length === 0 ? (
              <EmptyNote>
                Nu există documente pentru acest filtru în demonstrație.
              </EmptyNote>
            ) : (
              <ul className="divide-y divide-border">
                {filteredDocuments.map((document) => {
                  const relatedEvent = document.eventId
                    ? dashboard.events.find((event) => event.id === document.eventId)
                    : null;
                  return (
                    <li key={document.id}>
                      <button
                        type="button"
                        onClick={() => openDocument(document)}
                        className="flex w-full flex-col gap-1 py-3 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="font-medium">{document.title}</span>
                        <MetaLine>
                          {DOCUMENT_TYPE_LABEL[document.type]} ·{" "}
                          {formatDemoDate(document.date)}
                          {relatedEvent
                            ? ` · ${relatedEvent.title}`
                            : ""}
                        </MetaLine>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Prescripții">
            {sortedPrescriptions.length === 0 ? (
              <EmptyNote>
                Nu există prescripții demonstrative pentru acest profil.
              </EmptyNote>
            ) : (
              <ul className="divide-y divide-border">
                {sortedPrescriptions.map((prescription) => (
                  <li key={prescription.id}>
                    <button
                      type="button"
                      onClick={() => openPrescription(prescription)}
                      className="flex w-full flex-col gap-1 py-3 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="font-medium">{prescription.title}</span>
                      <MetaLine>
                        {formatDemoDate(prescription.date)} ·{" "}
                        {prescription.doctorName}
                      </MetaLine>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Lista nu confirmă dacă o prescripție este încă valabilă sau dacă
              tratamentul este urmat.
            </p>
          </SectionCard>
        </div>

        <div className="md:hidden">
          <CoverageCard dashboard={dashboard} />
        </div>
      </div>

      <DemoDialog
        open={panel?.kind === "edit-profile"}
        title="Editează profilul"
        description="Dialog demonstrativ. Nu salvează date reale și nu încarcă din nou dashboardul."
        onClose={closePanel}
      >
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium">Prenume</dt>
            <dd className="mt-1 text-muted-foreground">
              {dashboard.person.firstName}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Nume preferat</dt>
            <dd className="mt-1 text-muted-foreground">
              {displayValue(dashboard.person.editDetails.preferredName)}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Sex</dt>
            <dd className="mt-1 flex items-center gap-2 text-muted-foreground">
              <span
                className={sexDotClass(dashboard.person.sex)}
                aria-hidden="true"
              />
              {SEX_LABEL[dashboard.person.sex]}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Note personale</dt>
            <dd className="mt-1 text-muted-foreground">
              {displayValue(dashboard.person.editDetails.notes)}
            </dd>
          </div>
        </dl>
        <div className="flex justify-end pt-2">
          <PrimaryButton onClick={closePanel}>Închide</PrimaryButton>
        </div>
      </DemoDialog>

      <DemoDialog
        open={panel?.kind === "event"}
        title={panel?.kind === "event" ? panel.event.title : "Eveniment"}
        description="Detalii demonstrative ale evenimentului din timeline."
        onClose={closePanel}
        size="lg"
      >
        {panel?.kind === "event" ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {EVENT_TYPE_LABEL[panel.event.type]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDemoDate(panel.event.date)}
              </span>
            </div>
            <p className="leading-relaxed">{panel.event.detail}</p>
            <MetaLine>{panel.event.source}</MetaLine>

            <div>
              <h3 className="mb-2 font-medium">Documente asociate</h3>
              {eventDocuments.length === 0 ? (
                <EmptyNote>Nespecificat</EmptyNote>
              ) : (
                <ul className="space-y-2">
                  {eventDocuments.map((document) => (
                    <li key={document.id}>
                      <TextButton
                        onClick={() => openDocument(document)}
                      >
                        {document.title}
                      </TextButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-medium">Prescripții asociate</h3>
              {eventPrescriptions.length === 0 ? (
                <EmptyNote>Nespecificat</EmptyNote>
              ) : (
                <ul className="space-y-2">
                  {eventPrescriptions.map((prescription) => (
                    <li key={prescription.id}>
                      <TextButton
                        onClick={() => openPrescription(prescription)}
                      >
                        {prescription.title}
                      </TextButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={closePanel}>Închide</PrimaryButton>
            </div>
          </div>
        ) : null}
      </DemoDialog>

      <DemoDialog
        open={panel?.kind === "document"}
        title={
          panel?.kind === "document" ? panel.document.title : "Document"
        }
        description="Previzualizare demonstrativă. Fără descărcare sau upload."
        onClose={closePanel}
        size="md"
      >
        {panel?.kind === "document" ? (
          <div className="space-y-4 text-sm">
            <MetaLine>
              {DOCUMENT_TYPE_LABEL[panel.document.type]} ·{" "}
              {formatDemoDate(panel.document.date)}
            </MetaLine>
            <p className="rounded-xl bg-muted/60 p-4 leading-relaxed">
              {panel.document.preview}
            </p>
            {panel.document.eventId ? (
              <TextButton
                onClick={() => {
                  const event = dashboard.events.find(
                    (item) => item.id === panel.document.eventId,
                  );
                  if (event) {
                    openEvent(event);
                  }
                }}
              >
                Deschide evenimentul asociat
              </TextButton>
            ) : null}
            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={closePanel}>Închide</PrimaryButton>
            </div>
          </div>
        ) : null}
      </DemoDialog>

      <DemoDialog
        open={panel?.kind === "prescription"}
        title={
          panel?.kind === "prescription"
            ? panel.prescription.title
            : "Prescripție"
        }
        description="Detalii demonstrative ale prescripției. Nu confirmă valabilitatea."
        onClose={closePanel}
        size="md"
      >
        {panel?.kind === "prescription" ? (
          <div className="space-y-4 text-sm">
            <MetaLine>
              {formatDemoDate(panel.prescription.date)} ·{" "}
              {panel.prescription.doctorName}
            </MetaLine>
            <p className="leading-relaxed">{panel.prescription.instructions}</p>
            {panel.prescription.eventId ? (
              <TextButton
                onClick={() => {
                  const event = dashboard.events.find(
                    (item) => item.id === panel.prescription.eventId,
                  );
                  if (event) {
                    openEvent(event);
                  }
                }}
              >
                Deschide evenimentul asociat
              </TextButton>
            ) : null}
            <div className="flex justify-end pt-2">
              <PrimaryButton onClick={closePanel}>Închide</PrimaryButton>
            </div>
          </div>
        ) : null}
      </DemoDialog>

      <DemoDialog
        open={panel?.kind === "ask"}
        title="Întreabă KidOS"
        description="Asistentul nu este activ în această demonstrație."
        onClose={closePanel}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          KidOS nu generează răspunsuri medicale aici. Poți folosi timeline-ul și
          documentele pentru a revizui istoricul demonstrativ al persoanei
          selectate.
        </p>
        <div className="flex justify-end pt-2">
          <PrimaryButton onClick={closePanel}>Închide</PrimaryButton>
        </div>
      </DemoDialog>
    </div>
  );
}

function SummaryBlock({
  title,
  items,
}: {
  title: string;
  items: { text: string; source: string | null }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="text-sm">
            <p>{item.text}</p>
            {item.source && item.text !== "Nespecificat" ? (
              <MetaLine>{item.source}</MetaLine>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoverageCard({
  dashboard,
}: {
  dashboard: ReturnType<typeof getPatientDashboard>;
}) {
  return (
    <SectionCard title="Medici și acoperire">
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="font-medium">Medic de familie</dt>
          <dd className="mt-1 text-muted-foreground">
            {displayValue(dashboard.coverage.familyDoctor)}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Medici curanți</dt>
          <dd className="mt-1 text-muted-foreground">
            {dashboard.coverage.attendingDoctors.length > 0
              ? dashboard.coverage.attendingDoctors.join(", ")
              : "Nespecificat"}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Asigurare</dt>
          <dd className="mt-1 text-muted-foreground">
            {displayValue(dashboard.coverage.insurance)}
          </dd>
        </div>
      </dl>
    </SectionCard>
  );
}
