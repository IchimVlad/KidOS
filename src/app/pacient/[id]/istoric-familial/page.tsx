import { Suspense } from "react";
import { FamilyHistoryPage } from "@/components/family-history/family-history-page";

export default function IstoricFamilialPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă istoricul familial…
        </main>
      }
    >
      <FamilyHistoryPage />
    </Suspense>
  );
}
