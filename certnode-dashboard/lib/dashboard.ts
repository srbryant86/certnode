import { normalizePlanTier } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  getTierMetaByPlan,
  getTierMetaBySlug,
  getUpgradeRecommendation,
  type TierMeta,
} from "@/lib/pricing";
import type { DashboardMetrics, PlanSummary, ReceiptUsageSummary, TransactionUsageSummary } from "@/types";

const fallbackTier = getTierMetaBySlug("foundation");

const fallbackMetrics: DashboardMetrics = {
  usage: {
    receipts: {
      used: 0,
      limit: fallbackTier.limits.receipts,
      remaining: fallbackTier.limits.receipts,
      utilization: 0,
      overageCount: 0,
      overageCost: 0,
    },
    transactionValue: {
      usedCents: 0,
      limitCents: fallbackTier.limits.transactionValue
        ? fallbackTier.limits.transactionValue * 100
        : null,
      remainingCents: fallbackTier.limits.transactionValue
        ? fallbackTier.limits.transactionValue * 100
        : null,
      utilization: 0,
      overageCents: 0,
      overageCost: 0,
    },
    upgradeRecommendation: null,
  },
  plan: toPlanSummary(fallbackTier),
  uptimePercentage: 100,
  avgResponseTime: 0,
  errorRate: 0,
  currentCosts: 0,
  projectedCosts: fallbackTier.pricing.monthly ?? fallbackTier.pricing.yearly ?? 0,
  savings: 0,
  totalReceipts: 0,
  totalTransactionValueCents: 0,
  recentActivity: [],
};

export async function getDashboardOverview(enterpriseId: string | null): Promise<DashboardMetrics> {
  if (!enterpriseId) {
    return fallbackMetrics;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [enterprise, monthlyAggregate, allTimeAggregate, activityLogs] = await Promise.all([
    prisma.enterprise.findUnique({ where: { id: enterpriseId } }),
    prisma.receipt.aggregate({
      where: {
        enterpriseId,
        createdAt: { gte: monthStart },
      },
      _count: { id: true },
      _sum: { amountCents: true },
    }),
    prisma.receipt.aggregate({
      where: { enterpriseId },
      _count: { id: true },
      _sum: { amountCents: true },
    }),
    prisma.auditLog.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const plan = normalizePlanTier(enterprise?.billingTier ?? null);
  const tierMeta = getTierMetaByPlan(plan);

  const monthlyReceipts = monthlyAggregate._count.id ?? 0;
  const monthlyValueCents = Number(monthlyAggregate._sum.amountCents ?? BigInt(0));
  const totalReceipts = allTimeAggregate._count.id ?? 0;
  const totalValueCents = Number(allTimeAggregate._sum.amountCents ?? BigInt(0));

  const receiptsUsage = buildReceiptUsage(tierMeta, monthlyReceipts);
  const transactionUsage = buildTransactionUsage(tierMeta, monthlyValueCents);

  const upgradeRecommendation = shouldRecommendUpgrade(receiptsUsage, transactionUsage)
    ? getUpgradeRecommendation(tierMeta.id)
    : null;

  const monthlyBasePrice = tierMeta.pricing.monthly ?? (tierMeta.pricing.yearly ? tierMeta.pricing.yearly / 12 : 0);
  const projectedBasePrice = tierMeta.pricing.yearly ?? tierMeta.pricing.monthly ?? 0;
  const currentOverageCost = receiptsUsage.overageCost + transactionUsage.overageCost;

  return {
    usage: {
      receipts: receiptsUsage,
      transactionValue: transactionUsage,
      upgradeRecommendation,
    },
    plan: toPlanSummary(tierMeta),
    uptimePercentage: 99.99,
    avgResponseTime: 180,
    errorRate: 0.002,
    currentCosts: monthlyBasePrice + currentOverageCost,
    projectedCosts: projectedBasePrice,
    savings: upgradeRecommendation?.discount
      ? monthlyBasePrice * upgradeRecommendation.discount
      : 0,
    totalReceipts,
    totalTransactionValueCents: totalValueCents,
    recentActivity: activityLogs.map((log) => ({
      id: log.id,
      type: mapActivityType(log.action),
      description: log.action,
      timestamp: log.createdAt,
      metadata: normalizeMetadata(log.details),
    })),
  } satisfies DashboardMetrics;
}

function buildReceiptUsage(tier: TierMeta, monthlyReceipts: number): ReceiptUsageSummary {
  const limit = tier.limits.receipts;
  if (limit == null) {
    return {
      used: monthlyReceipts,
      limit: null,
      remaining: null,
      utilization: 0,
      overageCount: 0,
      overageCost: 0,
    };
  }

  const remaining = Math.max(limit - monthlyReceipts, 0);
  const overageCount = Math.max(monthlyReceipts - limit, 0);
  const overageCost = tier.overage ? overageCount * tier.overage.receipts : 0;

  return {
    used: monthlyReceipts,
    limit,
    remaining,
    utilization: Math.min(monthlyReceipts / limit, 1),
    overageCount,
    overageCost,
  };
}

function buildTransactionUsage(tier: TierMeta, monthlyValueCents: number): TransactionUsageSummary {
  const limitDollars = tier.limits.transactionValue;
  const limitCents = limitDollars != null ? limitDollars * 100 : null;

  if (limitCents == null) {
    return {
      usedCents: monthlyValueCents,
      limitCents: null,
      remainingCents: null,
      utilization: 0,
      overageCents: 0,
      overageCost: 0,
    };
  }

  const remainingCents = Math.max(limitCents - monthlyValueCents, 0);
  const overageCents = Math.max(monthlyValueCents - limitCents, 0);
  const overageCost =
    tier.overage && tier.limits.transactionValueUnit
      ? calculateTransactionOverage(
          overageCents,
          tier.limits.transactionValueUnit,
          tier.overage.transactionValue,
        )
      : 0;

  return {
    usedCents: monthlyValueCents,
    limitCents,
    remainingCents,
    utilization: limitCents === 0 ? 0 : Math.min(monthlyValueCents / limitCents, 1),
    overageCents,
    overageCost,
  };
}

function calculateTransactionOverage(
  overageCents: number,
  incrementDollars: number,
  rate: number,
): number {
  if (overageCents <= 0) {
    return 0;
  }

  const overageDollars = overageCents / 100;
  const increments = Math.ceil(overageDollars / incrementDollars);
  return increments * rate;
}

function shouldRecommendUpgrade(
  receipts: ReceiptUsageSummary,
  transactions: TransactionUsageSummary,
): boolean {
  const receiptsLimit = receipts.limit ?? Infinity;
  const receiptUtilization = receipts.limit ? receipts.used / receipts.limit : 0;
  const transactionUtilization = transactions.limitCents
    ? transactions.usedCents / transactions.limitCents
    : 0;

  return (
    receipts.overageCount > 0 ||
    transactions.overageCents > 0 ||
    receiptUtilization >= 0.8 ||
    transactionUtilization >= 0.8 ||
    receiptsLimit === 0
  );
}

function toPlanSummary(tier: TierMeta): PlanSummary {
  return {
    slug: tier.id,
    name: tier.name,
    retentionYears: tier.retentionYears,
    pricing: tier.pricing,
    featureHighlights: tier.featureHighlights,
  };
}

function mapActivityType(action: string): "receipt_generated" | "api_key_created" | "user_invited" {
  const normalized = action.toLowerCase();
  if (normalized.includes("api_key")) {
    return "api_key_created";
  }

  if (normalized.includes("invite") || normalized.includes("user")) {
    return "user_invited";
  }

  return "receipt_generated";
}

function normalizeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  return { value };
}

