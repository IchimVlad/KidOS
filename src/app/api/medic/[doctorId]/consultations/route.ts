import { connection } from "next/server";
import { listDoctorInbox } from "@/lib/data/doctor-consultations";
import { assertDoctorExists } from "@/lib/data/doctors";
import { doctorInboxTabSchema } from "@/lib/doctor/types";

type RouteContext = {
  params: Promise<{ doctorId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  await connection();
  const { doctorId } = await context.params;
  const exists = await assertDoctorExists(doctorId);
  if (!exists) {
    return Response.json({ error: "Medicul nu există." }, { status: 404 });
  }

  const tabParam = new URL(request.url).searchParams.get("tab") ?? "requested";
  const tab = doctorInboxTabSchema.safeParse(tabParam);
  if (!tab.success) {
    return Response.json({ error: "Tab invalid." }, { status: 400 });
  }

  const consultations = await listDoctorInbox(doctorId, tab.data);
  return Response.json({ consultations });
}
