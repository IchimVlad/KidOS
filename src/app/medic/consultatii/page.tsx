import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { DoctorConsultationsPage } from "@/components/doctor/doctor-consultations-page";
import { listDoctorInbox } from "@/lib/data/doctor-consultations";
import { getDefaultDoctor } from "@/lib/data/doctors";
import { doctorChatTabSchema } from "@/lib/doctor/types";

type PageProps = {
  searchParams: Promise<{ chat?: string; tab?: string }>;
};

export default function MedicConsultatiiPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă inbox-ul medicului…
        </main>
      }
    >
      <MedicConsultatiiContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MedicConsultatiiContent({ searchParams }: PageProps) {
  await connection();
  const doctor = await getDefaultDoctor();
  if (!doctor) {
    notFound();
  }

  const params = await searchParams;
  if (params.tab === "requested") {
    redirect("/medic#solicitari");
  }

  const tabParsed = doctorChatTabSchema.safeParse(params.tab);
  const initialTab = tabParsed.success ? tabParsed.data : "active";

  const [requested, active, closed] = await Promise.all([
    listDoctorInbox(doctor.id, "requested"),
    listDoctorInbox(doctor.id, "active"),
    listDoctorInbox(doctor.id, "closed"),
  ]);

  if (
    params.chat &&
    requested.some((item) => item.id === params.chat) &&
    !active.some((item) => item.id === params.chat) &&
    !closed.some((item) => item.id === params.chat)
  ) {
    redirect("/medic#solicitari");
  }

  return (
    <DoctorConsultationsPage
      doctor={doctor}
      initialActive={active}
      initialClosed={closed}
      initialTab={initialTab}
    />
  );
}
