import { connection } from "next/server";
import {
  createConsultationForPatient,
  listConversationsForPatient,
} from "@/lib/data/consultations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const conversations = await listConversationsForPatient(id);
  return Response.json({ conversations });
}

export async function POST(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;

  try {
    const conversation = await createConsultationForPatient({ patientId: id });
    return Response.json({ conversation }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Nu s-a putut crea consultația." },
      { status: 400 },
    );
  }
}
