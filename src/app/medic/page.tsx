import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { DoctorDashboardPage } from "@/components/doctor/doctor-dashboard-page";
import { listDoctorInbox } from "@/lib/data/doctor-consultations";
import { getDefaultDoctor } from "@/lib/data/doctors";

type PageProps = {
  searchParams: Promise<{ chat?: string; tab?: string }>;
};

export default function MedicPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          Se încarcă dashboard-ul medicului…
        </main>
      }
    >
      <MedicDashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function MedicDashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  if (params.tab === "requested") {
    redirect("/medic#solicitari");
  }
  if (params.chat || params.tab === "active" || params.tab === "closed") {
    const query = new URLSearchParams();
    if (params.chat) {
      query.set("chat", params.chat);
    }
    if (params.tab === "active" || params.tab === "closed") {
      query.set("tab", params.tab);
    } else {
      query.set("tab", "active");
    }
    redirect(`/medic/consultatii?${query.toString()}`);
  }

  await connection();
  const doctor = await getDefaultDoctor();
  if (!doctor) {
    notFound();
  }

  const [requested, active, closed] = await Promise.all([
    listDoctorInbox(doctor.id, "requested"),
    listDoctorInbox(doctor.id, "active"),
    listDoctorInbox(doctor.id, "closed"),
  ]);

  return (
    <DoctorDashboardPage
      doctor={doctor}
      requested={requested}
      active={active}
      closed={closed}
    />
  );
}
