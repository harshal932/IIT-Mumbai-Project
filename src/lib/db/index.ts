import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadEnvConfig } from "@next/env";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/localloop";

// Connect timeout set to 0.1s (100ms) with max 2 connections and 0 retries
const client = postgres(connectionString, {
  max: 2,
  idle_timeout: 5,
  connect_timeout: 0.1, // 100ms fast fail
  max_lifetime: 5,
  onnotice: () => {},
});

export const db = drizzle(client, {
  schema,
  logger: false,
});

/**
 * Fast DB Fallback Wrapper — prevents any DB connection hang from blocking server page rendering.
 * Executes query with a strict 100ms timeout race. If the database is unreachable or slow,
 * returns fallbackValue instantly (< 10ms).
 */
export async function withDbFallback<T>(
  fn: () => Promise<T>,
  fallbackValue: T,
  timeoutMs = 100
): Promise<T> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB_TIMEOUT")), timeoutMs)
    );
    const execution = fn().catch(() => fallbackValue);
    return await Promise.race([execution, timeout]);
  } catch {
    return fallbackValue;
  }
}

export type DB = typeof db;
export * from "./schema";
