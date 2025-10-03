import { KeyStatus, EnterpriseTier, PrismaClient, UserRole, VerificationStatus } from "@prisma/client";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient();

const DEFAULT_OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe@2025!";

async function main() {
  let enterprise = await prisma.enterprise.findFirst({
    where: { domain: "reference.certnode.io" },
  });

  if (!enterprise) {
    enterprise = await prisma.enterprise.create({
      data: {
        name: "CertNode Reference Enterprise",
        domain: "reference.certnode.io",
        tier: EnterpriseTier.PRO,
        billingTier: EnterpriseTier.PRO,
        settings: JSON.stringify({}),
      },
    });
  }

  const ownerPasswordHash = await hashPassword(DEFAULT_OWNER_PASSWORD);

  const owner = await prisma.user.upsert({
    where: { email: "owner@certnode.io" },
    update: {
      name: "CertNode Owner",
      role: UserRole.ADMIN,
      enterpriseId: enterprise.id,
      passwordHash: ownerPasswordHash,
    },
    create: {
      email: "owner@certnode.io",
      name: "CertNode Owner",
      role: UserRole.ADMIN,
      enterpriseId: enterprise.id,
      passwordHash: ownerPasswordHash,
    },
  });

  const apiKey = await seedApiKey(enterprise.id, owner.id);
  await seedReceipts(enterprise.id, apiKey.id, owner.id);
  await seedAuditLogs(enterprise.id, owner.id);
}

async function seedApiKey(enterpriseId: string, userId: string) {
  const existingKey = await prisma.apiKey.findFirst({
    where: { enterpriseId, name: "Seed API Key" },
  });

  if (existingKey) {
    return existingKey;
  }

  const keySecret = "ck_live_reference_secret";
  const keyHash = await hashPassword(keySecret);

  return prisma.apiKey.create({
    data: {
      enterpriseId,
      userId,
      name: "Seed API Key",
      keyHash,
      keyPreview: keySecret.slice(0, 12),
      permissions: JSON.stringify(["receipts:read", "receipts:write"]),
      rateLimit: 2000,
      rateLimitWindow: "1m",
      ipRestrictions: JSON.stringify([]),
      status: KeyStatus.ACTIVE,
    },
  });
}

async function seedReceipts(enterpriseId: string, apiKeyId: string, userId: string) {
  const existing = await prisma.receipt.count({ where: { enterpriseId } });
  if (existing > 0) {
    return;
  }

  const now = Date.now();

  const receipts = await Promise.all(
    Array.from({ length: 8 }).map((_, index) =>
      prisma.receipt.create({
        data: {
          enterpriseId,
          apiKeyId,
          transactionId: `txn_${index + 1}_ref`,
          transactionData: {
            reference: `PO-${1000 + index}`,
            counterparty: "CertNode QA",
            amount: 1200 + index * 135,
          },
          cryptographicProof: {
            version: 1,
            proofHash: `hash_${index}`,
            signature: `signature_${index}`,
          },
          verificationStatus:
            index % 5 === 0 ? VerificationStatus.FAILED : VerificationStatus.VERIFIED,
          createdAt: new Date(now - index * 1000 * 60 * 60 * 6),
        },
      })
    )
  );

  await prisma.auditLog.createMany({
    data: receipts.map((receipt, index) => ({
      enterpriseId,
      userId,
      action: index % 5 === 0 ? "receipt.verification_failed" : "receipt.generated",
      resourceType: "receipt",
      resourceId: receipt.id,
      details: JSON.stringify({
        transactionId: receipt.transactionId,
      }),
      createdAt: receipt.createdAt,
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
    })),
  });
}

async function seedAuditLogs(enterpriseId: string, userId: string) {
  const apiKeyLog = await prisma.auditLog.findFirst({
    where: { enterpriseId, action: "api_key.created" },
  });

  if (apiKeyLog) {
    return;
  }

  await prisma.auditLog.createMany({
    data: [
      {
        enterpriseId,
        userId,
        action: "api_key.created",
        resourceType: "api_key",
        resourceId: "seed",
        details: { permissions: ["receipts:read", "receipts:write"] },
        ipAddress: "127.0.0.1",
        userAgent: "seed-script",
      },
      {
        enterpriseId,
        userId,
        action: "user.invited",
        resourceType: "user",
        resourceId: "invitee@certnode.io",
        details: { role: "developer" },
        ipAddress: "127.0.0.1",
        userAgent: "seed-script",
      },
    ],
  });
}

async function seedUsageMetrics(enterpriseId: string) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  await prisma.usageMetric.upsert({
    where: {
      enterpriseId_periodStart_periodEnd: {
        enterpriseId,
        periodStart,
        periodEnd,
      },
    },
    update: {
      receiptsGenerated: 230,
      overageReceipts: 0,
      overageChargesCents: BigInt(0),
    },
    create: {
      enterpriseId,
      periodStart,
      periodEnd,
      receiptsGenerated: 230,
      overageReceipts: 0,
      overageChargesCents: BigInt(0),
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

