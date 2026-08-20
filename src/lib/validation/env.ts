import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url("AUTH_URL must be a valid URL").optional(),

  // OAuth (optional — only required if providers are configured)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Storage
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),

  // Redis (optional for MVP — in-memory fallback used if absent)
  REDIS_URL: z.string().optional(),

  // Map (optional — defaults to OSM tiles which need no key)
  NEXT_PUBLIC_MAP_API_KEY: z.string().optional(),

  // Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

let _env: Env;

/**
 * Validate and cache environment variables.
 * Call this once at startup (e.g., in db/index.ts or auth/config.ts).
 * Throws on invalid config — never silently falls back.
 */
export function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  return validateEnv();
}
