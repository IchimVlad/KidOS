import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PatientDashboardPage } from "@/components/patient-dashboard/patient-dashboard-page";
import { getPatientDashboardById } from "@/lib/data/dashboard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function PacientPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă dashboardul…
        </main>
      }
    >
      <PacientDashboard params={params} />
    </Suspense>
  );
}

async function PacientDashboard({ params }: PageProps) {
  const { id } = await params;
  const dashboard = await getPatientDashboardById(id);
  if (!dashboard) {
    notFound();
  }

  return <PatientDashboardPage dashboard={dashboard} />;
}
