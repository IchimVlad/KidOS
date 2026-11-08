import { connection } from "next/server";
import { createNutritionEntry } from "@/lib/data/nutrition";
import {
  createNutritionEntrySchema,
  firstIssueMessage,
} from "@/lib/nutrition/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Date invalide." }, { status: 400 });
  }

  const body = createNutritionEntrySchema.safeParse(json);
  if (!body.success) {
    return Response.json(
      { error: firstIssueMessage(body.error) },
      { status: 400 },
    );
  }

  const entry = await createNutritionEntry(id, body.data);
  if (!entry) {
    return Response.json(
      { error: "Profilul nu a fost găsit." },
      { status: 404 },
    );
  }
  return Response.json({ entry }, { status: 201 });
}
