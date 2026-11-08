import { Suspense } from "react";
import { PatientSelectPage } from "@/components/patient-select/patient-select-page";
import { listProfilesForSpace } from "@/lib/data/profiles";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 text-sm text-muted-foreground">
          Se încarcă profilurile…
        </main>
      }
    >
      <HomeProfiles />
    </Suspense>
  );
}

async function HomeProfiles() {
  const profiles = await listProfilesForSpace();
  return <PatientSelectPage initialProfiles={profiles} />;
}
