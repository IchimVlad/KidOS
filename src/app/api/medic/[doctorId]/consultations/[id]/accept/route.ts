import { connection } from "next/server";
import { acceptConsultation } from "@/lib/data/doctor-consultations";
import { assertDoctorExists } from "@/lib/data/doctors";

type RouteContext = {
  params: Promise<{ doctorId: string; id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  await connection();
  const { doctorId, id } = await context.params;
  const exists = await assertDoctorExists(doctorId);
  if (!exists) {
    return Response.json({ error: "Medicul nu există." }, { status: 404 });
  }

  const consultation = await acceptConsultation({
    consultationId: id,
    doctorId,
  });

  if (!consultation) {
    return Response.json(
      { error: "Consultația nu poate fi preluată." },
      { status: 409 },
    );
  }

  return Response.json({ consultation });
}
