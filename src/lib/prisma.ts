import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Neon closes idle connections (and suspends the database when it's unused). Dropping
// our own idle connections quickly means we never reuse a dead one, which showed up as
// "Server has closed the connection" and bounced the user back to the login page.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 10_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
