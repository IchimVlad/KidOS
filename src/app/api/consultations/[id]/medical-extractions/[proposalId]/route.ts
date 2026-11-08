import { connection } from "next/server";
import { z } from "zod";
import {
  isMedicalExtractionMigrationMissing,
  reviewMedicalExtraction,
} from "@/lib/data/medical-extractions";
import { medicalExtractionSelectionSchema } from "@/lib/medical-extraction";

type RouteContext = {
  params: Promise<{ id: string; proposalId: string }>;
};

const reviewSchema = z.object({
  action: z.enum(["accept", "reject"]),
  selected: medicalExtractionSelectionSchema.optional(),
});

export async function PUT(request: Request, context: RouteContext) {
  await connection();
  const { id, proposalId } = await context.params;
  const body = reviewSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Selecția nu este validă." }, { status: 400 });
  }

  let result;
  try {
    result = await reviewMedicalExtraction({
      consultationId: id,
      proposalId,
      ...body.data,
    });
  } catch (error) {
    if (isMedicalExtractionMigrationMissing(error)) {
      return Response.json(
        {
          error:
            "Baza de date nu are încă tabelele pentru extragerea medicală. Rulați npm run db:migrate:deploy și reporniți aplicația.",
        },
        { status: 503 },
      );
    }
    throw error;
  }
  if (result.status === "not-found") {
    return Response.json(
      { error: "Propunerea sau profilul nu a fost găsit." },
      { status: 404 },
    );
  }
  if (result.status === "already-reviewed") {
    return Response.json(
      { error: "Propunerea a fost deja revizuită." },
      { status: 409 },
    );
  }
  if (result.status === "invalid-selection") {
    return Response.json(
      { error: "Alegeți cel puțin o informație validă pentru salvare." },
      { status: 400 },
    );
  }
  if (result.status === "field-limit") {
    return Response.json(
      {
        error:
          "Selecția depășește limita de 2.000 de caractere pentru un câmp. Debifați unele informații și încercați din nou.",
      },
      { status: 400 },
    );
  }

  return Response.json({ ok: true });
}
