/**
 * Consistent error classes for server-side use.
 * Never expose internal details to clients — use toClientError() before returning.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests. Please try again later.", "RATE_LIMITED", 429);
    this.name = "RateLimitError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

/**
 * Safe error response — never leaks stack traces in production.
 */
export function toClientError(
  error: unknown,
  defaultMessage = "An unexpected error occurred"
): { error: string; code?: string; details?: Record<string, string[]> } {
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      code: error.code,
      details: error.fieldErrors,
    };
  }
  if (error instanceof AppError) {
    return { error: error.message, code: error.code };
  }
  // In production never expose unknown error details
  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return { error: error.message };
  }
  return { error: defaultMessage };
}

/**
 * HTTP status code from an error.
 */
export function statusFromError(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}

/**
 * Safe server-side error logger — never logs secrets.
 */
export function logError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, message, meta ?? "");
}
