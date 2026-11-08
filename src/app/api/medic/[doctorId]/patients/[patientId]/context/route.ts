import { connection } from "next/server";
import { getDoctorPatientContext } from "@/lib/data/doctor-consultations";
import { assertDoctorExists } from "@/lib/data/doctors";

type RouteContext = {
  params: Promise<{ doctorId: string; patientId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connection();
  const { doctorId, patientId } = await context.params;
  const exists = await assertDoctorExists(doctorId);
  if (!exists) {
    return Response.json({ error: "Medicul nu există." }, { status: 404 });
  }

  const patientContext = await getDoctorPatientContext(patientId);
  if (!patientContext) {
    return Response.json({ error: "Pacientul nu există." }, { status: 404 });
  }

  return Response.json({ context: patientContext });
}
