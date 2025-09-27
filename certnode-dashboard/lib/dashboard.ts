import { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardMetrics } from "@/types";

const QUOTA_BY_TIER: Record<PlanTier, number> = {
  [PlanTier.STARTER]: 10_000,
  [PlanTier.GROWTH]: 100_000,
  [PlanTier.BUSINESS]: 500_000,
  [PlanTier.ENTERPRISE]: 1_000_000,
};

const fallbackMetrics: DashboardMetrics = {
  receiptsThisMonth: 0,
  remainingQuota: 0,
  quotaUtilization: 0,
  uptimePercentage: 100,
  avgResponseTime: 0,
  errorRate: 0,
  currentCosts: 0,
  projectedCosts: 0,
  savings: 0,
  totalReceipts: 0,
  recentActivity: [],
};

export async function getDashboardOverview(enterpriseId: string | null): Promise<DashboardMetrics> {
  if (!enterpriseId) {
    return fallbackMetrics;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [monthlyCount, totalReceipts, activityLogs, usageMetric, enterprise] = await Promise.all([
    prisma.receipt.count({
      where: {
        enterpriseId,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.receipt.count({ where: { enterpriseId } }),
    prisma.auditLog.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.usageMetric.findFirst({
      where: {
        enterpriseId,
        periodStart: { lte: monthStart },
        periodEnd: { gte: monthEnd },
      },
    }),
    prisma.enterprise.findUnique({ where: { id: enterpriseId } }),
  ]);

  const planTier = enterprise?.billingTier ?? PlanTier.STARTER;
  const monthlyQuota = QUOTA_BY_TIER[planTier];

  const receiptsGenerated = usageMetric?.receiptsGenerated ?? monthlyCount;
  const remainingQuota = Math.max(monthlyQuota - receiptsGenerated, 0);
  const quotaUtilization = monthlyQuota === 0 ? 0 : Math.min(receiptsGenerated / monthlyQuota, 1);

  const currentCosts = (usageMetric?.receiptsGenerated ?? monthlyCount) * 0.02;
  const projectedCosts = monthlyQuota * 0.02;
  const savings = Math.max(monthlyQuota - receiptsGenerated, 0) * 0.015;

  return {
    receiptsThisMonth: receiptsGenerated,
    remainingQuota,
    quotaUtilization,
    uptimePercentage: 99.99,
    avgResponseTime: 180,
    errorRate: 0.002,
    currentCosts,
    projectedCosts,
    savings,
    totalReceipts,
    recentActivity: activityLogs.map((log) => ({
      id: log.id,
      type: mapActivityType(log.action),
      description: log.action,
      timestamp: log.createdAt,
      metadata: log.details ?? undefined,
    })),
  } satisfies DashboardMetrics;
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
