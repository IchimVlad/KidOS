import { connection } from "next/server";
import { upsertHydration } from "@/lib/data/nutrition";
import { firstIssueMessage, upsertHydrationSchema } from "@/lib/nutrition/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Date invalide." }, { status: 400 });
  }

  const body = upsertHydrationSchema.safeParse(json);
  if (!body.success) {
    return Response.json(
      { error: firstIssueMessage(body.error) },
      { status: 400 },
    );
  }

  const hydration = await upsertHydration(id, body.data);
  if (!hydration) {
    return Response.json(
      { error: "Profilul nu a fost găsit." },
      { status: 404 },
    );
  }
  return Response.json({ hydration });
}
