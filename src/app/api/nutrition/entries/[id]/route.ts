import { connection } from "next/server";
import { deleteNutritionEntry } from "@/lib/data/nutrition";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const deleted = await deleteNutritionEntry(id);
  if (!deleted) {
    return Response.json(
      { error: "Masa nu a fost găsită." },
      { status: 404 },
    );
  }
  return Response.json({ ok: true });
}
