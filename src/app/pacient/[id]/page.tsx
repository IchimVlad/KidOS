import { Suspense } from "react";
import { PatientDashboardPage } from "@/components/patient-dashboard/patient-dashboard-page";

export default function PacientPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă dashboardul…
        </main>
      }
    >
      <PatientDashboardPage />
    </Suspense>
  );
}
