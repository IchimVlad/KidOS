import { connection } from "next/server";
import {
  extractMedicalFacts,
  GeminiExtractionError,
} from "@/lib/gemini-medical-extraction";
import {
  createMedicalExtractionDraft,
  getMedicalExtractionInput,
  isMedicalExtractionMigrationMissing,
  listMedicalExtractionDrafts,
} from "@/lib/data/medical-extractions";
import { MEDICAL_EXTRACTION_CATEGORIES } from "@/lib/medical-extraction";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  try {
    const proposals = await listMedicalExtractionDrafts(id);
    return Response.json({ proposals });
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
}

export async function POST(_request: Request, context: RouteContext) {
  await connection();
  const { id } = await context.params;
  const extractionInput = await getMedicalExtractionInput(id);
  if (!extractionInput) {
    return Response.json(
      { error: "Consultația nu a fost găsită." },
      { status: 404 },
    );
  }
  if (!extractionInput.messages.some((message) => message.sender === "patient")) {
    return Response.json(
      { error: "Conversația nu conține mesaje de la pacient sau aparținător." },
      { status: 400 },
    );
  }

  try {
    await listMedicalExtractionDrafts(id);
    const proposedData = await extractMedicalFacts(extractionInput);
    const hasFacts = MEDICAL_EXTRACTION_CATEGORIES.some(
      (category) => proposedData[category].length > 0,
    );
    if (!hasFacts) {
      return Response.json({ proposal: null });
    }

    const proposal = await createMedicalExtractionDraft({
      consultationId: id,
      proposedData,
    });
    return Response.json({ proposal }, { status: 201 });
  } catch (error) {
    if (error instanceof GeminiExtractionError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
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
}
