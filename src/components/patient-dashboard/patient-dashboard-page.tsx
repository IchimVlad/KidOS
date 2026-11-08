"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import { DemoDialog } from "@/components/patient-select/dialog";
import {
  EmptyNote,
  FilterChips,
  MetaLine,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  TextButton,
} from "@/components/patient-dashboard/ui";
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
  PatientDashboard,
  Prescription,
  TimelineEvent,
  TimelineFilter,
} from "@/lib/patient-dashboard/types";
import { RELATION_LABEL, SEX_LABEL } from "@/lib/patient-select";
import { sexCardClass, sexDotClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

type Panel =
  | { kind: "edit-profile" }
  | { kind: "event"; event: TimelineEvent }
  | { kind: "document"; document: MedicalDocument }
  | { kind: "prescription"; prescription: Prescription }
  | { kind: "ask" }
  | null;

export function PatientDashboardPage({
  dashboard,
}: {
  dashboard: PatientDashboard;
}) {
  const router = useRouter();
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [documentFilter, setDocumentFilter] = useState<DocumentType | "all">(
    "all",
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [requestingConsult, setRequestingConsult] = useState(false);

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
              className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <img
                src="/kidos-logo.png"
                alt=""
                width={28}
                height={28}
                className="size-7"
              />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Kidos
              </span>
            </Link>
            <div className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
            <Link
              href="/"
              className="truncate text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Schimbă persoana
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <SecondaryButton
              onClick={() => setPanel({ kind: "ask" })}
              className="px-3 py-2 text-xs sm:px-4 sm:text-sm"
            >
              Întreabă KidOS
            </SecondaryButton>
            <PrimaryButton
              disabled={requestingConsult}
              onClick={async () => {
                if (requestingConsult) {
                  return;
                }
                setRequestingConsult(true);
                try {
                  const response = await fetch(
                    `/api/pacient/${dashboard.person.id}/consultations`,
                    { method: "POST" },
                  );
                  if (!response.ok) {
                    return;
                  }
                  const payload = (await response.json()) as {
                    conversation: { id: string };
                  };
                  router.push(
                    `/pacient/${dashboard.person.id}/consultatii?chat=${payload.conversation.id}`,
                  );
                  router.refresh();
                } finally {
                  setRequestingConsult(false);
                }
              }}
              className="px-3 py-2 text-xs sm:px-5 sm:text-sm"
            >
              Solicită consultație
            </PrimaryButton>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,38%)_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-6">
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
          </aside>

          <SectionCard
            title="Timeline medical"
            emphasized
            className="flex min-h-0 min-w-0 flex-col overflow-hidden md:h-0 md:min-h-full"
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
                    Nu există evenimente pentru acest filtru.
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

        {dashboard.activeConsultation ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,38%)_minmax(0,1fr)]">
            <SectionCard
              title="Consultație activă"
              className="min-w-0 md:col-start-2"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {dashboard.activeConsultation.title}
                  </p>
                  <MetaLine>
                    {dashboard.activeConsultation.statusLabel}
                  </MetaLine>
                </div>
                <TextButton
                  onClick={() => {
                    if (dashboard.activeConsultation == null) {
                      return;
                    }
                    router.push(
                      `/pacient/${dashboard.person.id}/consultatii?chat=${dashboard.activeConsultation.id}`,
                    );
                  }}
                >
                  Deschide conversația
                </TextButton>
              </div>
            </SectionCard>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,38%)_minmax(0,1fr)]">
          <CoverageCard dashboard={dashboard} />

          <SectionCard title="Documente medicale" className="min-w-0">
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
                Nu există documente pentru acest filtru.
              </EmptyNote>
            ) : (
              <ul className="divide-y divide-border">
                {filteredDocuments.map((document) => {
                  const relatedEvent = document.eventId
                    ? dashboard.events.find(
                        (event) => event.id === document.eventId,
                      )
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
                          {relatedEvent ? ` · ${relatedEvent.title}` : ""}
                        </MetaLine>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <DemoDialog
        open={panel?.kind === "edit-profile"}
        title="Editează profilul"
        description="Previzualizare a datelor de profil. Editarea nu este disponibilă aici."
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
        description="Detalii ale evenimentului din timeline."
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
        description="Previzualizare document. Fără descărcare sau upload."
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
        description="Detalii ale prescripției. Nu confirmă valabilitatea curentă."
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
        description="Asistentul nu este activ momentan."
        onClose={closePanel}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          KidOS nu generează răspunsuri medicale aici. Poți folosi timeline-ul și
          documentele pentru a revizui istoricul persoanei selectate.
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
  dashboard: PatientDashboard;
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
