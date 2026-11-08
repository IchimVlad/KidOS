import { Suspense } from "react";
import { connection } from "next/server";
import { DoctorSelectPage } from "@/components/doctor/doctor-select-page";
import { listDoctors } from "@/lib/data/doctors";

export default function MedicPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 text-sm text-muted-foreground">
          Se încarcă medicii…
        </main>
      }
    >
      <MedicDoctors />
    </Suspense>
  );
}

async function MedicDoctors() {
  await connection();
  const doctors = await listDoctors();
  return <DoctorSelectPage initialDoctors={doctors} />;
}
