"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileAvatar } from "@/components/patient-select/avatar";
import { DemoDialog } from "@/components/patient-select/dialog";
import { RequestConsultationDialog } from "@/components/patient-dashboard/request-consultation-dialog";
import {
  EmptyNote,
  FilterChips,
  MetaLine,
  PrimaryButton,
  SectionCard,
  TextButton,
} from "@/components/patient-dashboard/ui";
import type { ConsultationRequestInput } from "@/lib/consultations/request-form";
import {
  DOCUMENT_FILTERS,
  DOCUMENT_TYPE_LABEL,
  EVENT_TYPE_LABEL,
  TIMELINE_FILTERS,
  displayValue,
  formatDemoDate,
  matchesTimelineFilter,
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
import { sexCardClass, sexDotClass, sexThemeClass } from "@/lib/patient-sex";
import { cn } from "@/lib/utils";

type Panel =
  | { kind: "edit-profile" }
  | { kind: "event"; event: TimelineEvent }
  | { kind: "document"; document: MedicalDocument }
  | { kind: "prescription"; prescription: Prescription }
  | { kind: "request-consult" }
  | null;

function isUnspecified(text: string | null | undefined): boolean {
  if (text == null || text.trim().length === 0) {
    return true;
  }
  const normalized = text.toLowerCase();
  return (
    normalized === "nespecificat" ||
    /\b(nu|nicio|niciun|fără|fara|necunoscut|necunoscute)\b/.test(normalized)
  );
}

function joinMedicalValues(items: { text: string | null }[]): string | null {
  const values = items
    .map((item) => item.text?.trim() ?? "")
    .filter((text) => text.length > 0 && !isUnspecified(text));
  return values.length > 0 ? values.join(", ") : null;
}

export function PatientDashboardPage({
  dashboard,
}: {
  dashboard: PatientDashboard;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [documentFilter, setDocumentFilter] = useState<DocumentType | "all">(
    "all",
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [requestingConsult, setRequestingConsult] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

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

  function openChat() {
    router.push(`/pacient/${dashboard.person.id}/consultatii`);
  }

  function openActiveConsultation() {
    if (dashboard.activeConsultation == null) {
      return;
    }
    router.push(
      `/pacient/${dashboard.person.id}/consultatii?chat=${dashboard.activeConsultation.id}`,
    );
  }

  async function submitConsultationRequest(
    input: ConsultationRequestInput,
  ) {
    if (requestingConsult) {
      return;
    }
    setRequestingConsult(true);
    try {
      const response = await fetch(
        `/api/pacient/${dashboard.person.id}/consultations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        conversation: { id: string };
      };
      setPanel(null);
      router.push(
        `/pacient/${dashboard.person.id}/consultatii?chat=${payload.conversation.id}`,
      );
      router.refresh();
    } finally {
      setRequestingConsult(false);
    }
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

  const coverageHasData =
    !isUnspecified(dashboard.coverage.familyDoctor) ||
    dashboard.coverage.attendingDoctors.length > 0 ||
    !isUnspecified(dashboard.coverage.insurance);

  const showDocumentFilters = dashboard.documents.length > 3;
  const recentPrescriptions = dashboard.prescriptions.slice(0, 5);

  const activeIsPending =
    dashboard.activeConsultation?.status === "pending";

  return (
    <div
      className={cn(
        "chat-shell min-h-dvh text-foreground",
        sexThemeClass(dashboard.person.sex),
      )}
    >
      <div className="sticky top-0 z-40">
        <header className="border-b border-border/70 bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
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
                  KidOS
                </span>
              </Link>
              <div
                className="hidden h-4 w-px shrink-0 bg-border sm:block"
                aria-hidden="true"
              />
              <Link
                href={`/pacient/${dashboard.person.id}/istoric-familial${queryString ? `?${queryString}` : ""}`}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
              >
                Istoric familial
              </Link>
              <Link
                href={`/pacient/${dashboard.person.id}/nutritie`}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
              >
                Nutriție
              </Link>
              <Link
                href="/"
                className="truncate text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Schimbă persoana
              </Link>
            </div>

            <PrimaryButton
              onClick={openChat}
              className="min-h-11 shrink-0 px-4 py-2 text-sm sm:px-5"
            >
              Deschide chat
            </PrimaryButton>
          </div>
        </header>

        {dashboard.activeConsultation ? (
          <div
            className={cn(
              "border-b backdrop-blur-sm",
              activeIsPending
                ? "border-status-wait/30 bg-status-wait-soft/90"
                : "border-status-live/25 bg-status-live-soft/90",
            )}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] font-semibold tracking-wide uppercase",
                    activeIsPending
                      ? "text-status-wait-foreground"
                      : "text-status-live-foreground",
                  )}
                >
                  {activeIsPending ? "Solicitare trimisă" : "Consultație activă"}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold tracking-tight">
                  {dashboard.activeConsultation.title}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    activeIsPending
                      ? "text-status-wait-foreground/90"
                      : "text-status-live-foreground/90",
                  )}
                >
                  {dashboard.activeConsultation.statusLabel}
                </p>
              </div>
              <PrimaryButton
                onClick={openActiveConsultation}
                className="min-h-11 shrink-0 px-4 py-2 text-sm"
              >
                Deschide conversația
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6 md:grid-cols-[minmax(0,38%)_minmax(0,1fr)] md:grid-rows-[auto_auto_auto] md:gap-6 md:py-8",
          dashboard.activeConsultation == null
            ? "pb-24 md:pb-8"
            : "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        )}
      >
        <SectionCard
          title="Profil"
          quiet
          className={cn(
            "order-1 min-w-0 md:col-start-1 md:row-start-1 md:order-none",
            sexCardClass(dashboard.person.sex),
          )}
          action={
            <TextButton onClick={() => setPanel({ kind: "edit-profile" })}>
              Detalii profil
            </TextButton>
          }
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <ProfileAvatar
              label={dashboard.person.firstName}
              size="md"
              sex={dashboard.person.sex}
            />
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-lg font-semibold tracking-tight sm:text-xl">
                <span
                  className={sexDotClass(dashboard.person.sex)}
                  aria-hidden="true"
                />
                {dashboard.person.firstName}
              </p>
              <p className="text-sm text-muted-foreground">
                {dashboard.person.ageLabel}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {RELATION_LABEL[dashboard.person.relation]} ·{" "}
                {SEX_LABEL[dashboard.person.sex]}
              </p>
            </div>
          </div>

          {!coverageHasData ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Medic de familie și asigurare: nespecificate
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <PrimaryButton
              disabled={requestingConsult}
              onClick={() => setPanel({ kind: "request-consult" })}
              className="min-h-11 w-full px-4 py-2.5 text-sm sm:w-auto"
            >
              Solicită consultație
            </PrimaryButton>
            <TextButton onClick={openChat} className="min-h-11 px-1 sm:px-2">
              Deschide chat
            </TextButton>
          </div>
        </SectionCard>

        <SectionCard
          title="Timeline medical"
          emphasized
          className="order-2 flex min-h-0 min-w-0 flex-col md:col-start-2 md:row-span-2 md:row-start-1 md:order-none md:h-0 md:min-h-full"
          bodyClassName="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
        >
          <div className="shrink-0">
            <FilterChips
              label="Filtre timeline"
              options={TIMELINE_FILTERS}
              value={timelineFilter}
              onChange={setTimelineFilter}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain overflow-x-visible">
            {filteredEvents.length === 0 ? (
              <div className="flex min-h-40 flex-col items-start justify-center gap-3 py-2">
                <EmptyNote>
                  {timelineFilter === "all"
                    ? "Nu există încă evenimente în timeline."
                    : "Nu există evenimente pentru acest filtru."}
                </EmptyNote>
                {timelineFilter === "all" &&
                dashboard.activeConsultation == null ? (
                  <PrimaryButton
                    disabled={requestingConsult}
                    onClick={() => setPanel({ kind: "request-consult" })}
                    className="min-h-11 px-4 py-2 text-sm"
                  >
                    Solicită consultație
                  </PrimaryButton>
                ) : null}
              </div>
            ) : (
              <ol className="space-y-0 py-1 pl-3 sm:pl-4">
                {filteredEvents.map((event, index) => {
                  const isLast = index === filteredEvents.length - 1;
                  const isLatest = index === 0;
                  return (
                    <li key={event.id} className="flex gap-2.5 sm:gap-3">
                      <div
                        className="relative flex w-4 shrink-0 justify-center self-stretch overflow-visible sm:w-5"
                        aria-hidden="true"
                      >
                        <span
                          className={cn(
                            "absolute left-1/2 w-px -translate-x-1/2 bg-border",
                            isLatest ? "top-3.5" : "top-0",
                            isLast ? "h-3.5" : "bottom-0",
                          )}
                        />
                        <span className="relative z-10 mt-2 flex size-2.5 shrink-0 items-center justify-center sm:mt-2.5 sm:size-3">
                          {isLatest ? (
                            <span className="timeline-pulse-ring pointer-events-none absolute inset-0 rounded-full" />
                          ) : null}
                          <span className="relative size-2.5 rounded-full border-2 border-background bg-foreground shadow-[0_0_0_3px] shadow-foreground/10 sm:size-3 sm:shadow-[0_0_0_4px]" />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEvent(event)}
                        className={cn(
                          "min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5 sm:py-2.5",
                          !isLast && "mb-1.5 sm:mb-2",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <time
                            dateTime={event.date}
                            className="text-[11px] font-medium tabular-nums text-muted-foreground"
                          >
                            {formatDemoDate(event.date)}
                          </time>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                            {EVENT_TYPE_LABEL[event.type]}
                          </span>
                          {event.hasAttachment ? (
                            <span className="text-[11px] text-muted-foreground">
                              Atașament
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-semibold tracking-tight">
                          {event.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {event.summary}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </SectionCard>

        <section
          className={cn(
            "order-3 min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5 md:col-start-1 md:row-start-2 md:order-none md:p-6",
            dashboard.person.sex === "female" && "border-sex-female/25",
            dashboard.person.sex === "male" && "border-sex-male/25",
          )}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left md:pointer-events-none"
            aria-expanded={summaryOpen}
            onClick={() => setSummaryOpen((current) => !current)}
          >
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              Sumar de sănătate
            </h2>
            <span
              className="text-sm text-muted-foreground md:hidden"
              aria-hidden="true"
            >
              {summaryOpen ? "Ascunde" : "Arată"}
            </span>
          </button>
          <div className={cn("mt-4", !summaryOpen && "hidden md:block")}>
            <HealthSummaryContent dashboard={dashboard} />
          </div>
        </section>

        {coverageHasData ? (
          <div className="order-4 min-w-0 md:col-start-1 md:row-start-3 md:order-none">
            <CoverageCard dashboard={dashboard} />
          </div>
        ) : null}

        <section className="order-5 min-w-0 rounded-2xl border border-border/70 bg-muted/70 p-4 sm:p-5 md:col-start-2 md:row-start-3 md:order-none md:p-6">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            Dosar medical
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-6">
            <div className="min-w-0">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Documente
                </h3>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {filteredDocuments.length}
                </span>
              </div>
              {showDocumentFilters ? (
                <div className="mb-3">
                  <FilterChips
                    label="Filtre documente"
                    options={DOCUMENT_FILTERS}
                    value={documentFilter}
                    onChange={setDocumentFilter}
                  />
                </div>
              ) : null}
              {filteredDocuments.length === 0 ? (
                <EmptyNote>
                  {showDocumentFilters
                    ? "Niciun document pentru filtru."
                    : "Niciun document încă."}
                </EmptyNote>
              ) : (
                <ul className="divide-y divide-border/70">
                  {filteredDocuments.map((document) => (
                    <li key={document.id}>
                      <button
                        type="button"
                        onClick={() => openDocument(document)}
                        className="flex min-h-11 w-full items-start justify-between gap-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-snug">
                            {document.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {DOCUMENT_TYPE_LABEL[document.type]}
                          </span>
                        </span>
                        <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {formatDemoDate(document.date)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-w-0 border-t border-border/50 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Rețete
                </h3>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {dashboard.prescriptions.length}
                </span>
              </div>
              {recentPrescriptions.length === 0 ? (
                <EmptyNote>Nicio rețetă încă.</EmptyNote>
              ) : (
                <ul className="divide-y divide-border/70">
                  {recentPrescriptions.map((prescription) => (
                    <li key={prescription.id}>
                      <button
                        type="button"
                        onClick={() => openPrescription(prescription)}
                        className="flex min-h-11 w-full items-start justify-between gap-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-snug">
                            {prescription.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {prescription.doctorName}
                          </span>
                        </span>
                        <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {formatDemoDate(prescription.date)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {dashboard.activeConsultation == null ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden">
          <PrimaryButton
            disabled={requestingConsult}
            onClick={() => setPanel({ kind: "request-consult" })}
            className="min-h-11 w-full px-4 py-2.5 text-sm"
          >
            Solicită consultație
          </PrimaryButton>
        </div>
      ) : null}

      <DemoDialog
        open={panel?.kind === "edit-profile"}
        title="Detalii profil"
        description={`${dashboard.person.firstName} · ${dashboard.person.ageLabel}`}
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
        description={
          panel?.kind === "event"
            ? `${EVENT_TYPE_LABEL[panel.event.type]} · ${formatDemoDate(panel.event.date)}`
            : undefined
        }
        onClose={closePanel}
        size="lg"
      >
        {panel?.kind === "event" ? (
          <div className="space-y-4 text-sm">
            <p className="leading-relaxed">{panel.event.detail}</p>
            <MetaLine>{panel.event.source}</MetaLine>

            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Documente asociate
              </h3>
              {eventDocuments.length === 0 ? (
                <EmptyNote>Niciun document asociat.</EmptyNote>
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
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Rețete asociate
              </h3>
              {eventPrescriptions.length === 0 ? (
                <EmptyNote>Nicio rețetă asociată.</EmptyNote>
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
        description={
          panel?.kind === "document"
            ? `${DOCUMENT_TYPE_LABEL[panel.document.type]} · ${formatDemoDate(panel.document.date)}`
            : undefined
        }
        onClose={closePanel}
        size="md"
      >
        {panel?.kind === "document" ? (
          <div className="space-y-4 text-sm">
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
        description={
          panel?.kind === "prescription"
            ? `${formatDemoDate(panel.prescription.date)} · ${panel.prescription.doctorName}`
            : undefined
        }
        onClose={closePanel}
        size="md"
      >
        {panel?.kind === "prescription" ? (
          <div className="space-y-4 text-sm">
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

      <RequestConsultationDialog
        key={
          panel?.kind === "request-consult" ? "request-open" : "request-closed"
        }
        open={panel?.kind === "request-consult"}
        patientName={dashboard.person.firstName}
        ageYears={dashboard.person.ageYears}
        busy={requestingConsult}
        onClose={closePanel}
        onSubmit={(input) => void submitConsultationRequest(input)}
      />
    </div>
  );
}

function splitHealthItems(text: string | null | undefined): string[] {
  if (text == null || isUnspecified(text)) {
    return [];
  }
  return text
    .split(/(?:\r?\n+|;\s*|,\s*(?=[A-ZĂÂÎȘȚ])|\s+•\s+|\s+-\s+|\s+și\s+)/i)
    .map((part) => part.replace(/^[\s,;•\-–]+|[\s,;•\-–]+$/g, "").trim())
    .filter((part) => part.length > 0 && !isUnspecified(part));
}

function HealthSummaryContent({
  dashboard,
}: {
  dashboard: PatientDashboard;
}) {
  const allergies = splitHealthItems(dashboard.health.allergies[0]?.text);
  const conditions = splitHealthItems(dashboard.health.conditions[0]?.text);
  const treatments = splitHealthItems(
    dashboard.health.currentTreatments[0]?.text,
  );
  const allergyText = joinMedicalValues(dashboard.health.allergies);
  const conditionText = joinMedicalValues(dashboard.health.conditions);
  const treatmentText = joinMedicalValues(
    dashboard.health.currentTreatments,
  );
  const allergyClear = allergyText === null;
  const conditionClear = conditionText === null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <HealthFactList
          label="Alergii"
          items={allergies}
          emptyLabel="Fără alergii cunoscute"
          tone="alert"
          value={allergyText ?? "Fără alergii cunoscute"}
          tone={allergyClear ? "clear" : "alert"}
        />
        <HealthFactList
          label="Afecțiuni"
          items={conditions}
          emptyLabel="Fără afecțiuni declarate"
          tone="alert"
          value={conditionText ?? "Fără afecțiuni declarate"}
          tone={conditionClear ? "clear" : "alert"}
        />
        <HealthFactList
          label="Tratamente"
          items={treatments}
          emptyLabel="Fără tratamente curente"
          tone="neutral"
          value={treatmentText ?? "Fără tratamente curente"}
          tone="clear"
        />
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Măsurători
        </h3>
        {dashboard.health.measurements.length === 0 ? (
          <EmptyNote>Fără măsurători din formular</EmptyNote>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {dashboard.health.measurements.slice(0, 4).map((measurement) => (
              <li
                key={measurement.id}
                className="rounded-xl border border-border/70 bg-card px-3 py-2.5"
              >
                <p className="truncate text-[10px] font-medium text-muted-foreground">
                  {measurement.label}
                </p>
                <p className="mt-1 truncate text-base font-semibold tracking-tight tabular-nums">
                  {measurement.value == null ? "—" : measurement.value}
                  {measurement.value != null && measurement.unit ? (
                    <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                      {measurement.unit}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HealthFactList({
  label,
  items,
  emptyLabel,
  tone,
}: {
  label: string;
  items: string[];
  emptyLabel: string;
  tone: "alert" | "neutral";
}) {
  const hasItems = items.length > 0;

  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </h3>
        {hasItems ? (
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {items.length}
          </span>
        ) : null}
      </div>
      {hasItems ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={`${label}-${item}`}
              className={cn(
                "max-w-full rounded-lg border px-2.5 py-1.5 text-sm leading-snug",
                tone === "alert"
                  ? "border-primary/25 bg-accent text-accent-foreground"
                  : "border-border bg-secondary text-secondary-foreground",
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function CoverageCard({
  dashboard,
}: {
  dashboard: PatientDashboard;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-muted/70 p-4 sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight">
        Medici și acoperire
      </h2>
      <dl className="mt-3 space-y-3 text-sm">
        {!isUnspecified(dashboard.coverage.familyDoctor) ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Medic de familie
            </dt>
            <dd className="mt-0.5 font-medium">
              {dashboard.coverage.familyDoctor}
            </dd>
          </div>
        ) : null}
        {dashboard.coverage.attendingDoctors.length > 0 ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Medici curanți
            </dt>
            <dd className="mt-0.5 font-medium">
              {dashboard.coverage.attendingDoctors.join(", ")}
            </dd>
          </div>
        ) : null}
        {!isUnspecified(dashboard.coverage.insurance) ? (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              Asigurare
            </dt>
            <dd className="mt-0.5 font-medium">
              {dashboard.coverage.insurance}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
