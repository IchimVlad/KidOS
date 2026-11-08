import { connection } from "next/server";
import { listDoctors } from "@/lib/data/doctors";

export async function GET() {
  await connection();
  const doctors = await listDoctors();
  return Response.json({ doctors });
}
