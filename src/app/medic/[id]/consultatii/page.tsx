import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { DoctorConsultationsPage } from "@/components/doctor/doctor-consultations-page";
import {
  listDoctorInbox,
} from "@/lib/data/doctor-consultations";
import { getDoctorById } from "@/lib/data/doctors";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function MedicConsultatiiPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă inbox-ul medicului…
        </main>
      }
    >
      <MedicConsultatiiContent params={params} />
    </Suspense>
  );
}

async function MedicConsultatiiContent({ params }: PageProps) {
  await connection();
  const { id } = await params;
  const doctor = await getDoctorById(id);
  if (!doctor) {
    notFound();
  }

  const [requested, active, closed] = await Promise.all([
    listDoctorInbox(id, "requested"),
    listDoctorInbox(id, "active"),
    listDoctorInbox(id, "closed"),
  ]);

  return (
    <DoctorConsultationsPage
      doctor={doctor}
      initialRequested={requested}
      initialActive={active}
      initialClosed={closed}
    />
  );
}
