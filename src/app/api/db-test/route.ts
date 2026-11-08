import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  await connection();

  try {
    const rows = await getPrismaClient().$queryRaw<
      { database_time: Date }[]
    >`SELECT now() AS database_time`;

    return Response.json({
      ok: true,
      databaseTime: rows[0].database_time,
    });
  } catch (error) {
    console.error("Prisma database connectivity test failed:", error);

    return Response.json(
      {
        ok: false,
        error: "Database query failed. Check the server logs for details.",
      },
      { status: 500 },
    );
  }
}
