import { z } from "zod";

export const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(200, "Name cannot exceed 200 characters"),
  type: z.enum([
    "ngo",
    "resident_group",
    "business",
    "school",
    "government",
    "authority",
    "other",
  ]),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  contactMethod: z.string().max(200).optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  serviceArea: z.string().max(200).optional(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

export const AddOrgMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["member", "admin"]),
});

export const AuthorityResponseSchema = z.object({
  responseType: z.enum([
    "acknowledgment",
    "progress_update",
    "resolution_proposal",
  ]),
  message: z
    .string()
    .min(10, "Response must be at least 10 characters")
    .max(2000, "Response cannot exceed 2000 characters"),
  officialReference: z.string().max(200).optional(),
  isPublic: z.boolean().default(true),
});

export type AuthorityResponseInput = z.infer<typeof AuthorityResponseSchema>;
