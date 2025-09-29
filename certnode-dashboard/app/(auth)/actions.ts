"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { EnterpriseTier } from "@prisma/client";

export type AuthFormState = {
  status: "idle" | "error";
  message?: string;
};

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registrationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().min(2, "Company is required"),
  email: z.string().email("Enter a valid work email"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^\w\s]).+$/, "Use upper, lower, number, and symbol"),
});

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const input = Object.fromEntries(formData) as Record<string, string>;
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid credentials",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { status: "idle" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { status: "error", message: "Invalid email or password" };
        default:
          return { status: "error", message: "Authentication failed" };
      }
    }
    throw error;
  }
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const input = Object.fromEntries(formData) as Record<string, string>;
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  }

  const { email, password, company, name } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return {
      status: "error",
      message: "This email is already registered",
    };
  }

  const domain = normalizedEmail.split("@")[1] ?? "";

  const enterprise = await prisma.enterprise.create({
    data: {
      name: company,
      domain,
      billingTier: EnterpriseTier.STARTER,
      settings: {},
    },
  });

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      role: UserRole.ADMIN,
      enterpriseId: enterprise.id,
      passwordHash,
    },
  });

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: "/dashboard",
    });
    return { status: "idle" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: "Account created, but sign-in failed" };
    }
    throw error;
  }
}
