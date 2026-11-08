import { connection } from "next/server";
import {
  createConsultationForPatient,
  listConversationsForPatient,
} from "@/lib/data/consultations";
import {
  CONSULT_PACKAGES,
  consultationRequestSchema,
  formatConsultationRequestMessage,
} from "@/lib/consultations/request-form";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const conversations = await listConversationsForPatient(id);
  return Response.json({ conversations });
}

export async function POST(request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;

  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    bodyJson = {};
  }

  const isEmptyBody =
    bodyJson == null ||
    (typeof bodyJson === "object" &&
      !Array.isArray(bodyJson) &&
      Object.keys(bodyJson as object).length === 0);

  try {
    if (isEmptyBody) {
      const conversation = await createConsultationForPatient({
        patientId: id,
      });
      return Response.json({ conversation }, { status: 201 });
    }

    const body = consultationRequestSchema.safeParse(bodyJson);
    if (!body.success) {
      return Response.json({ error: "Date invalide." }, { status: 400 });
    }

    const pack = CONSULT_PACKAGES.find(
      (item) => item.id === body.data.packageId,
    );
    const totalFee =
      pack?.id === "chat" ? 120 : pack?.id === "urgent" ? 250 : 180;

    const conversation = await createConsultationForPatient({
      patientId: id,
      totalFee,
      initialMessage: formatConsultationRequestMessage(body.data),
    });
    return Response.json({ conversation }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Nu s-a putut crea consultația." },
      { status: 400 },
    );
  }
}
