import { z } from "zod";

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  locationArea: z.string().max(200).optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notificationRadius: z.number().int().min(1).max(500).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  nearbyAlerts: z.boolean().optional(),
  categoryAlerts: z.array(z.string().uuid()).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  showSensitiveContent: z.boolean().optional(),
  defaultVisibility: z
    .enum(["public", "local", "community", "anonymous_public", "private"])
    .optional(),
});

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

export const AddSkillSchema = z.object({
  skill: z.string().min(2).max(100),
});

export const AddLanguageSchema = z.object({
  language: z.string().min(2).max(100),
  proficiency: z.enum(["basic", "conversational", "fluent", "native"]),
});
