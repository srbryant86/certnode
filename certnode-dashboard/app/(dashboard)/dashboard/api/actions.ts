"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type RateLimitWindow,
} from "@/lib/api-keys";
import type { CreateApiKeyInput } from "@/lib/api-keys";

export type CreateApiKeyState = {
  status: "idle" | "error" | "success";
  message?: string;
  secret?: string;
};

export async function getApiKeysForEnterprise(enterpriseId: string | null) {
  if (!enterpriseId) {
    return [];
  }
  return listApiKeys(enterpriseId);
}

const rateLimitWindowValues = ["1m", "1h", "1d"] as const;
const permissionOptions = ["receipts:read", "receipts:write", "analytics:read"] as const;

const createSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  rateLimit: z.coerce
    .number({ message: "Rate limit must be a number" })
    .int()
    .positive()
    .max(1_000_000),
  rateLimitWindow: z.enum(rateLimitWindowValues),
  permissions: z
    .array(z.enum(permissionOptions))
    .transform((value) => {
      const selected = value.length === 0 ? permissionOptions.slice(0, 2) : value;
      return Array.from(new Set(selected));
    }),
  ipRestrictions: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(/[\n,]/).map((ip) => ip.trim()).filter(Boolean) : [])),
  expiresAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : null)),
});

export async function createApiKeyAction(
  _prev: CreateApiKeyState,
  formData: FormData,
): Promise<CreateApiKeyState> {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return { status: "error", message: "You need an enterprise workspace to create API keys." };
  }

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    rateLimit: formData.get("rateLimit"),
    rateLimitWindow: formData.get("rateLimitWindow"),
    permissions: formData.getAll("permissions").map(String),
    ipRestrictions: formData.get("ipRestrictions")?.toString(),
    expiresAt: formData.get("expiresAt")?.toString(),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message ?? "Unable to create API key",
    };
  }

  const payload = parsed.data;
  const safeExpiresAt = payload.expiresAt && !Number.isNaN(payload.expiresAt.getTime()) ? payload.expiresAt : null;

  try {
    const { secret } = await createApiKey({
      enterpriseId: session.user.enterpriseId,
      userId: session.user.id,
      name: payload.name,
      rateLimit: payload.rateLimit,
      rateLimitWindow: payload.rateLimitWindow as RateLimitWindow,
      permissions: payload.permissions,
      ipRestrictions: payload.ipRestrictions,
      expiresAt: safeExpiresAt,
    } satisfies CreateApiKeyInput);

    revalidatePath("/dashboard/api");

    return {
      status: "success",
      secret,
      message: "New API key generated. Copy it now; you won't see it again.",
    };
  } catch (error) {
    console.error("createApiKeyAction", error);
    return {
      status: "error",
      message: "Failed to create API key. Please try again.",
    };
  }
}

export async function revokeApiKeyAction(_prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.enterpriseId) {
    throw new Error("Unauthorized");
  }

  const apiKeyId = formData.get("apiKeyId");
  if (typeof apiKeyId !== "string" || apiKeyId.length === 0) {
    throw new Error("Invalid API key");
  }

  await revokeApiKey({
    apiKeyId,
    enterpriseId: session.user.enterpriseId,
    userId: session.user.id,
  });

  revalidatePath("/dashboard/api");
}

export async function revokeApiKeyFormAction(formData: FormData) {
  return revokeApiKeyAction(undefined, formData);
}
