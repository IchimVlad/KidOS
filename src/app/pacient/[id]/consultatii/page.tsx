import { Suspense } from "react";
import { ConsultationsPage } from "@/components/consultations/consultations-page";

export default function ConsultatiiPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă consultațiile…
        </main>
      }
    >
      <ConsultationsPage />
    </Suspense>
  );
}
