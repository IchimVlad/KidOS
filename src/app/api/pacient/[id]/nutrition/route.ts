import { connection } from "next/server";
import { z } from "zod";
import { getNutritionPageData } from "@/lib/data/nutrition";
import { addDays } from "@/lib/nutrition/dates";
import { firstIssueMessage, isoDateSchema } from "@/lib/nutrition/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const MAX_RANGE_DAYS = 92;

const rangeSchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine(
    (range) => range.from == null || range.to == null || range.from <= range.to,
    "Data de început trebuie să fie înaintea datei de sfârșit.",
  )
  .refine(
    (range) =>
      range.from == null ||
      range.to == null ||
      addDays(range.from, MAX_RANGE_DAYS) > range.to,
    `Intervalul poate avea cel mult ${MAX_RANGE_DAYS} de zile.`,
  );

export async function GET(request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const searchParams = new URL(request.url).searchParams;
  const query = rangeSchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  if (!query.success) {
    return Response.json(
      { error: firstIssueMessage(query.error) },
      { status: 400 },
    );
  }

  // Dacă lipsește un capăt, se completează astfel încât intervalul să aibă 7 zile.
  const { from, to } = query.data;
  let range: { from: string; to: string } | undefined;
  if (from != null && to != null) {
    range = { from, to };
  } else if (from != null) {
    range = { from, to: addDays(from, 6) };
  } else if (to != null) {
    range = { from: addDays(to, -6), to };
  }

  const data = await getNutritionPageData(id, range);
  if (!data) {
    return Response.json(
      { error: "Profilul nu a fost găsit." },
      { status: 404 },
    );
  }
  return Response.json(data);
}
