import { z } from "zod";

export const CreateProblemSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
  categoryId: z.string().uuid("Invalid category"),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  problemType: z.enum(["public", "personal"]),
  helpTypes: z
    .array(
      z.enum([
        "information",
        "advice",
        "volunteer",
        "resources",
        "donation",
        "professional",
        "authority_contact",
        "organization_support",
      ])
    )
    .min(1, "Select at least one type of help needed"),
  latitude: z
    .number()
    .min(-90)
    .max(90, "Invalid latitude"),
  longitude: z
    .number()
    .min(-180)
    .max(180, "Invalid longitude"),
  locationArea: z
    .string()
    .min(2, "Location area is required")
    .max(200, "Location area too long"),
  isAnonymous: z.boolean().default(false),
  affectedCount: z
    .number()
    .int()
    .min(1, "At least 1 person must be affected")
    .max(1_000_000),
  startedAt: z.string().datetime().optional(),
  visibility: z.enum(["public", "local", "community", "anonymous_public", "private"]),
  consentGiven: z.literal(true, {
    message: "You must confirm consent to post",
  }),
  isSensitive: z.boolean().default(false),
});

export type CreateProblemInput = z.infer<typeof CreateProblemSchema>;

export const UpdateProblemSchema = CreateProblemSchema.partial().omit({
  consentGiven: true,
});

export type UpdateProblemInput = z.infer<typeof UpdateProblemSchema>;

export const UpdateProblemStatusSchema = z.object({
  status: z.enum([
    "open",
    "receiving_support",
    "verification_in_progress",
    "help_matched",
    "action_in_progress",
    "awaiting_authority",
    "partially_solved",
    "solved_pending_confirmation",
    "resolved",
    "closed",
    "disputed",
    "archived",
  ]),
  message: z.string().max(1000).optional(),
});

export type UpdateProblemStatusInput = z.infer<typeof UpdateProblemStatusSchema>;

export const ProblemFiltersSchema = z.object({
  category: z.string().uuid().optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.string().optional(),
  helpType: z.string().optional(),
  verificationStatus: z.string().optional(),
  distance: z.coerce.number().min(0.1).max(500).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ProblemFiltersInput = z.infer<typeof ProblemFiltersSchema>;
