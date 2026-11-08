import { connection } from "next/server";
import { z } from "zod";
import { appendConsultationMessage } from "@/lib/data/consultations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const body = messageSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Mesaj invalid." }, { status: 400 });
  }

  const message = await appendConsultationMessage({
    consultationId: id,
    text: body.data.text,
  });

  if (!message) {
    return Response.json(
      { error: "Consultația nu a fost găsită." },
      { status: 404 },
    );
  }

  return Response.json({ message }, { status: 201 });
}
