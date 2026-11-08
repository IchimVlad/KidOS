import { connection } from "next/server";
import { z } from "zod";
import {
  createProfileInSpace,
  deleteProfile,
  listProfilesForSpace,
} from "@/lib/data/profiles";
import { patientRelationSchema, patientSexSchema } from "@/lib/patient-select";

const createProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(40),
  relation: patientRelationSchema,
  sex: patientSexSchema,
});

const deleteProfileSchema = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  await connection();
  const profiles = await listProfilesForSpace();
  return Response.json({ profiles });
}

export async function POST(request: Request) {
  await connection();
  const body = createProfileSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Date invalide." }, { status: 400 });
  }

  const profile = await createProfileInSpace(body.data);
  return Response.json({ profile }, { status: 201 });
}

export async function DELETE(request: Request) {
  await connection();
  const body = deleteProfileSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Date invalide." }, { status: 400 });
  }

  const deleted = await deleteProfile(body.data.id);
  if (!deleted) {
    return Response.json(
      { error: "Profilul nu a putut fi șters." },
      { status: 400 },
    );
  }
  return Response.json({ ok: true });
}
