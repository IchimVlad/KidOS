import { connection } from "next/server";
import { pingDatabase } from "@/lib/db";

export async function GET() {
  await connection();

  try {
    return Response.json(await pingDatabase());
  } catch {
    return Response.json(
      { ok: false, error: "Conexiunea la Postgres a eșuat." },
      { status: 503 },
    );
  }
}
