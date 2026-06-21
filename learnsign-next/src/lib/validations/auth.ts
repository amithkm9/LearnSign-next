import { z } from "zod";

const password = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(100),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]{10,15}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    userType: z.enum(["parent", "educator", "student", "other"]).default("parent"),
    ageGroup: z.enum(["1-4", "5-10", "15+"]).optional().or(z.literal("")),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
