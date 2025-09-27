import { randomBytes } from "crypto";
import { KeyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export type RateLimitWindow = "1m" | "1h" | "1d";

export type CreateApiKeyInput = {
  enterpriseId: string;
  userId: string;
  name: string;
  rateLimit: number;
  rateLimitWindow: RateLimitWindow;
  permissions: string[];
  ipRestrictions: string[];
  expiresAt: Date | null;
};

export async function listApiKeys(enterpriseId: string) {
  if (!enterpriseId) {
    return [];
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [keys, usage, monthlyUsage] = await Promise.all([
    prisma.apiKey.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.receipt.groupBy({
      by: ["apiKeyId"],
      where: { enterpriseId, apiKeyId: { not: null } },
      _count: { apiKeyId: true },
    }),
    prisma.receipt.groupBy({
      by: ["apiKeyId"],
      where: {
        enterpriseId,
        apiKeyId: { not: null },
        createdAt: { gte: monthStart },
      },
      _count: { apiKeyId: true },
    }),
  ]);

  const usageMap = new Map<string, number>();
  for (const row of usage) {
    if (row.apiKeyId) {
      usageMap.set(row.apiKeyId, row._count.apiKeyId ?? 0);
    }
  }

  const monthlyUsageMap = new Map<string, number>();
  for (const row of monthlyUsage) {
    if (row.apiKeyId) {
      monthlyUsageMap.set(row.apiKeyId, row._count.apiKeyId ?? 0);
    }
  }

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPreview: key.keyPreview,
    status: key.status,
    rateLimit: key.rateLimit,
    rateLimitWindow: key.rateLimitWindow as RateLimitWindow,
    permissions: key.permissions,
    ipRestrictions: key.ipRestrictions,
    lastUsed: key.lastUsed,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    usageCount: usageMap.get(key.id) ?? 0,
    monthlyUsageCount: monthlyUsageMap.get(key.id) ?? 0,
  }));
}

export async function createApiKey(input: CreateApiKeyInput) {
  const secret = generateApiKeySecret();
  const hashed = await hashPassword(secret);
  const keyPreview = secret.slice(0, 12);

  const apiKey = await prisma.apiKey.create({
    data: {
      enterpriseId: input.enterpriseId,
      userId: input.userId,
      name: input.name,
      keyHash: hashed,
      keyPreview,
      permissions: input.permissions,
      rateLimit: input.rateLimit,
      rateLimitWindow: input.rateLimitWindow,
      ipRestrictions: input.ipRestrictions,
      expiresAt: input.expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      enterpriseId: input.enterpriseId,
      userId: input.userId,
      action: "api_key.created",
      resourceType: "api_key",
      resourceId: apiKey.id,
      details: {
        name: apiKey.name,
        rateLimit: apiKey.rateLimit,
        rateLimitWindow: apiKey.rateLimitWindow,
      },
    },
  });

  return { apiKey, secret };
}

export async function revokeApiKey(params: {
  apiKeyId: string;
  enterpriseId: string;
  userId: string;
}) {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: params.apiKeyId,
      enterpriseId: params.enterpriseId,
    },
  });

  if (!apiKey) {
    throw new Error("API key not found");
  }

  if (apiKey.status === KeyStatus.REVOKED) {
    return apiKey;
  }

  const updated = await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      status: KeyStatus.REVOKED,
      expiresAt: apiKey.expiresAt ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      enterpriseId: params.enterpriseId,
      userId: params.userId,
      action: "api_key.revoked",
      resourceType: "api_key",
      resourceId: apiKey.id,
      details: {
        name: apiKey.name,
      },
    },
  });

  return updated;
}

function generateApiKeySecret() {
  const random = randomBytes(32);
  const token = random
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `ck_live_${token}`;
}
