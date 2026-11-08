import { connection } from "next/server";
import { z } from "zod";
import {
  createProfileInSpace,
  deleteProfile,
  listProfilesForSpace,
} from "@/lib/data/profiles";
import {
  patientRelationSchema,
  patientSexSchema,
  profileMedicalDetailsSchema,
} from "@/lib/patient-select";

const createProfileSchema = profileMedicalDetailsSchema.extend({
  firstName: z.string().trim().min(1).max(40),
  lastName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  relation: patientRelationSchema,
  sex: patientSexSchema,
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nașterii nu este validă.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value &&
        date <= new Date()
      );
    }, "Data nașterii nu poate fi în viitor."),
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

  const profile = await createProfileInSpace({
    ...body.data,
    dateOfBirth: new Date(`${body.data.dateOfBirth}T00:00:00.000Z`),
  });
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
