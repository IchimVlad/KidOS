import { connection } from "next/server";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FamilyHistoryPage } from "@/components/family-history/family-history-page";
import { getPatientDashboardById } from "@/lib/data/dashboard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function IstoricFamilialPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă istoricul familial…
        </main>
      }
    >
      <FamilyHistoryContent params={params} />
    </Suspense>
  );
}

async function FamilyHistoryContent({ params }: PageProps) {
  const { id } = await params;
  await connection();
  const dashboard = await getPatientDashboardById(id);

  if (!dashboard) {
    notFound();
  }

  return <FamilyHistoryPage person={dashboard.person} />;
}
