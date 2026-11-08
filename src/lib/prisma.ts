import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@/generated/prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}
