import { addDays } from "date-fns";
import { EnterpriseTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDashboardOverview } from "@/lib/dashboard";
import { formatBillingCycle, normalizePlanTier } from "@/lib/billing";
import { getTierMetaByPlan, listTierMetas, type TierMeta } from "@/lib/pricing";
import type { Invoice, PlanOption, SubscriptionData } from "@/types";
import type { DashboardMetrics } from "@/types/dashboard";

const tierOrder: readonly EnterpriseTier[] = [
  EnterpriseTier.FREE,
  EnterpriseTier.STARTER,
  EnterpriseTier.PRO,
  EnterpriseTier.ENTERPRISE,
];

const UNLIMITED_SENTINEL = Number.MAX_SAFE_INTEGER;

function compareTiers(a: EnterpriseTier, b: EnterpriseTier): number {
  return tierOrder.indexOf(a) - tierOrder.indexOf(b);
}

function isHigherTier(candidate: EnterpriseTier, current: EnterpriseTier): boolean {
  return compareTiers(candidate, current) > 0;
}

function isLowerTier(candidate: EnterpriseTier, current: EnterpriseTier): boolean {
  return compareTiers(candidate, current) < 0;
}

function toPlanOption(meta: TierMeta): PlanOption {
  if (!meta.planTier) {
    throw new Error("Tier meta missing plan tier mapping");
  }

  return {
    tier: meta.planTier,
    receiptsIncluded: meta.limits.receipts ?? UNLIMITED_SENTINEL,
    overageRate: meta.overage?.receipts ?? 0,
    monthlyPrice: meta.pricing.monthly ?? (meta.pricing.yearly ? meta.pricing.yearly / 12 : 0),
    yearlyPrice: meta.pricing.yearly ?? 0,
  } satisfies PlanOption;
}

async function buildInvoices(
  enterpriseId: string,
  tierMeta: TierMeta,
  overview: DashboardMetrics,
): Promise<Invoice[]> {
  const usage = await prisma.usageMetric.findMany({
    where: { enterpriseId },
    orderBy: { periodStart: "desc" },
    take: 6,
  });

  if (usage.length === 0) {
    const amountDue = overview.currentCosts;
    const now = new Date();
    return [
      {
        id: `inv_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`,
        status: "open",
        amountDue,
        dueDate: addDays(now, 7),
        invoicePdfUrl: `https://billing.certnode.io/invoices/${enterpriseId}/preview`,
      },
    ];
  }

  const baseMonthly = tierMeta.pricing.monthly ?? (tierMeta.pricing.yearly ? tierMeta.pricing.yearly / 12 : 0);

  return usage.map((record) => {
    const receiptOverage = Number(record.overageChargesCents ?? BigInt(0)) / 100;
    const transactionOverage = Number(record.transactionOverageCents ?? BigInt(0)) / 100;
    const amountDue = parseFloat((baseMonthly + receiptOverage + transactionOverage).toFixed(2));
    const status = record.periodEnd < new Date() ? "paid" : "open";

    return {
      id: `inv_${record.periodStart.getFullYear()}${String(record.periodStart.getMonth() + 1).padStart(2, "0")}`,
      status,
      amountDue,
      dueDate: addDays(record.periodEnd, 7),
      invoicePdfUrl: `https://billing.certnode.io/invoices/${enterpriseId}/${record.id}`,
    } satisfies Invoice;
  });
}

interface SubscriptionDataOptions {
  overview?: DashboardMetrics;
}

export async function getSubscriptionData(
  enterpriseId: string,
  options: SubscriptionDataOptions = {},
): Promise<SubscriptionData> {
  const enterprise = await prisma.enterprise.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      billingTier: true,
      subscriptionId: true,
      name: true,
    },
  });

  if (!enterprise) {
    throw new Error("Enterprise not found");
  }

  const overview =
    options.overview ??
    (await getDashboardOverview(enterpriseId));

  const normalizedTier = normalizePlanTier(enterprise.billingTier);
  const tierMeta = getTierMetaByPlan(normalizedTier);

  const availableTierMetas = listTierMetas().filter((meta) => meta.planTier !== null);
  const availableUpgrades = availableTierMetas
    .filter((meta): meta is TierMeta & { planTier: EnterpriseTier } => Boolean(meta.planTier))
    .filter((meta) => meta.planTier && isHigherTier(meta.planTier, normalizedTier))
    .map(toPlanOption);

  const downgradeCandidates = availableTierMetas
    .filter((meta): meta is TierMeta & { planTier: EnterpriseTier } => Boolean(meta.planTier))
    .filter((meta) => meta.planTier && isLowerTier(meta.planTier, normalizedTier));

  const receiptsUsed = overview.usage.receipts.used;
  const transactionUsedDollars = overview.usage.transactionValue.usedCents / 100;

  const downgradeLimitations: string[] = [];
  const availableDowngrades: PlanOption[] = [];

  for (const candidate of downgradeCandidates) {
    const receiptsLimit = candidate.limits.receipts;
    const transactionLimit = candidate.limits.transactionValue;
    const issues: string[] = [];

    if (typeof receiptsLimit === "number" && receiptsLimit < receiptsUsed) {
      issues.push(
        `Receipts usage (${receiptsUsed.toLocaleString()}) exceeds ${candidate.name} monthly limit (${receiptsLimit.toLocaleString()}).`,
      );
    }

    if (typeof transactionLimit === "number" && transactionLimit < transactionUsedDollars) {
      issues.push(
        `Transaction value this month ($${transactionUsedDollars.toLocaleString()} USD) exceeds ${candidate.name} threshold ($${transactionLimit.toLocaleString()} USD).`,
      );
    }

    if (issues.length > 0) {
      downgradeLimitations.push(...issues);
    } else if (candidate.planTier) {
      availableDowngrades.push(toPlanOption(candidate));
    }
  }

  const invoices = await buildInvoices(enterpriseId, tierMeta, overview);

  return {
    currentPlan: {
      tier: normalizedTier,
      receiptsIncluded: tierMeta.limits.receipts ?? UNLIMITED_SENTINEL,
      overageRate: tierMeta.overage?.receipts ?? 0,
      billingCycle: formatBillingCycle(normalizedTier),
    },
    currentUsage: {
      receiptsUsed,
      overageReceipts: overview.usage.receipts.overageCount,
      currentCosts: overview.currentCosts,
      projectedCosts: overview.projectedCosts,
    },
    invoices,
    paymentMethods: [],
    availableUpgrades,
    availableDowngrades,
    downgradeLimitations,
    upgradeRecommendation: overview.usage.upgradeRecommendation,
  } satisfies SubscriptionData;
}

export function findPlanOption(target: EnterpriseTier): PlanOption | null {
  const meta = listTierMetas().find((item) => item.planTier === target);
  if (!meta || !meta.planTier) {
    return null;
  }
  return toPlanOption(meta);
}

export function canMatchTier(
  overview: DashboardMetrics,
  candidate: TierMeta,
): boolean {
  const receiptsLimit = candidate.limits.receipts;
  const transactionLimit = candidate.limits.transactionValue;
  const receiptsUsed = overview.usage.receipts.used;
  const transactionUsedDollars = overview.usage.transactionValue.usedCents / 100;

  if (typeof receiptsLimit === "number" && receiptsUsed > receiptsLimit) {
    return false;
  }

  if (typeof transactionLimit === "number" && transactionUsedDollars > transactionLimit) {
    return false;
  }

  return true;
}

export function getTierMetaByPlanStrict(plan: EnterpriseTier): TierMeta {
  const meta = listTierMetas().find((item) => item.planTier === plan);
  if (!meta) {
    throw new Error(`Unknown plan tier: ${plan}`);
  }
  return meta;
}

export function getTierOrder(): readonly EnterpriseTier[] {
  return tierOrder;
}
export function compareEnterpriseTiers(a: EnterpriseTier, b: EnterpriseTier): number {
  return compareTiers(a, b);
}

export function comparePlanTiers(a: EnterpriseTier, b: EnterpriseTier): number {
  return compareTiers(a, b);
}
