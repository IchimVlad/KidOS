import { connection } from "next/server";
import { z } from "zod";
import { updateDoctorNotes } from "@/lib/data/doctor-consultations";
import { assertDoctorExists } from "@/lib/data/doctors";

type RouteContext = {
  params: Promise<{ doctorId: string; id: string }>;
};

const notesSchema = z.object({
  notes: z.string().max(5000),
});

export async function PUT(request: Request, context: RouteContext) {
  await connection();
  const { doctorId, id } = await context.params;
  const exists = await assertDoctorExists(doctorId);
  if (!exists) {
    return Response.json({ error: "Medicul nu există." }, { status: 404 });
  }

  const body = notesSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Notă invalidă." }, { status: 400 });
  }

  const consultation = await updateDoctorNotes({
    consultationId: id,
    doctorId,
    notes: body.data.notes,
  });

  if (!consultation) {
    return Response.json(
      { error: "Nota nu a putut fi salvată." },
      { status: 409 },
    );
  }

  return Response.json({ consultation });
}
