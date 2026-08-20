import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Automatically load .env.local and .env
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/localloop",
  },
  verbose: true,
  strict: true,
});
