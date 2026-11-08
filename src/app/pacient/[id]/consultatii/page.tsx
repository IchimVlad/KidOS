import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ConsultationsPage } from "@/components/consultations/consultations-page";
import { listConversationsForPatient } from "@/lib/data/consultations";
import { getPatientDashboardById } from "@/lib/data/dashboard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ConsultatiiPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă consultațiile…
        </main>
      }
    >
      <ConsultatiiContent params={params} />
    </Suspense>
  );
}

async function ConsultatiiContent({ params }: PageProps) {
  const { id } = await params;
  const dashboard = await getPatientDashboardById(id);
  if (!dashboard) {
    notFound();
  }

  const conversations = await listConversationsForPatient(id);

  return (
    <ConsultationsPage
      patientId={dashboard.person.id}
      patientName={dashboard.person.firstName}
      patientSex={dashboard.person.sex}
      initialConversations={conversations}
    />
  );
}
