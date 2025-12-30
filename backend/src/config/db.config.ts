import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "./env.config.js";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PostgreSQL connection pool with SSL for hosted databases (Render, etc.)
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render and similar hosted databases
  },
});

// Create Prisma adapter with pg pool
const adapter = new PrismaPg(pool);

// Initialize Prisma client with adapter (required for Prisma 7 client engine)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}