import { connection } from "next/server";
import { deleteConsultation } from "@/lib/data/consultations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const deleted = await deleteConsultation(id);
  if (!deleted) {
    return Response.json(
      { error: "Consultația nu a putut fi ștearsă." },
      { status: 404 },
    );
  }
  return Response.json({ ok: true });
}
