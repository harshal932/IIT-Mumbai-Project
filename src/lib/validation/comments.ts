import { z } from "zod";

export const CreateCommentSchema = z.object({
  content: z
    .string()
    .min(2, "Comment must be at least 2 characters")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(2, "Comment must be at least 2 characters")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export const CreateHelpOfferSchema = z.object({
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
    .min(1, "Select at least one type of help"),
  message: z
    .string()
    .min(10, "Please describe how you can help (min 10 characters)")
    .max(1000, "Message cannot exceed 1000 characters"),
  isPrivate: z.boolean().default(true),
});

export type CreateHelpOfferInput = z.infer<typeof CreateHelpOfferSchema>;

export const UpdateHelpOfferStatusSchema = z.object({
  status: z.enum(["accepted", "declined", "completed", "cancelled"]),
});

export const CreateReportSchema = z.object({
  contentType: z.enum(["problem", "comment", "user"]),
  contentId: z.string().uuid("Invalid content ID"),
  reason: z.enum([
    "misinformation",
    "spam",
    "scam",
    "harassment",
    "hate_speech",
    "violence",
    "privacy_violation",
    "off_topic",
    "duplicate",
    "other",
  ]),
  description: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const CreateVerificationSchema = z.object({
  verificationType: z.enum(["confirm", "dispute", "evidence"]),
  note: z.string().max(500).optional(),
});

export type CreateVerificationInput = z.infer<typeof CreateVerificationSchema>;
