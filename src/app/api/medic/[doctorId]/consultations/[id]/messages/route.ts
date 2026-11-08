import { connection } from "next/server";
import { z } from "zod";
import { appendDoctorMessage } from "@/lib/data/doctor-consultations";
import { assertDoctorExists } from "@/lib/data/doctors";

type RouteContext = {
  params: Promise<{ doctorId: string; id: string }>;
};

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request, context: RouteContext) {
  await connection();
  const { doctorId, id } = await context.params;
  const exists = await assertDoctorExists(doctorId);
  if (!exists) {
    return Response.json({ error: "Medicul nu există." }, { status: 404 });
  }

  const body = messageSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Mesaj invalid." }, { status: 400 });
  }

  const message = await appendDoctorMessage({
    consultationId: id,
    doctorId,
    text: body.data.text,
  });

  if (!message) {
    return Response.json(
      { error: "Mesajul nu a putut fi trimis." },
      { status: 409 },
    );
  }

  return Response.json({ message }, { status: 201 });
}
