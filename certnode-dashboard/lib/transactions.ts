import { normalizePlanTier } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  getTierMetaByPlan,
  getUpgradeRecommendation,
  type UpgradeRecommendation,
} from "@/lib/pricing";

export interface TransactionValidationPayload {
  enterpriseId: string;
  amountCents: number;
}

export interface TransactionValidationResult {
  allowed: boolean;
  receipts: {
    currentCount: number;
    limit: number | null;
    willExceed: boolean;
    overageCount: number;
  };
  transactionValue: {
    currentValueCents: number;
    limitCents: number | null;
    willExceed: boolean;
    overageCents: number;
  };
  upgradeRecommendation: UpgradeRecommendation | null;
}

export async function validateTransaction(
  payload: TransactionValidationPayload,
): Promise<TransactionValidationResult> {
  const enterprise = await prisma.enterprise.findUnique({
    where: { id: payload.enterpriseId },
  });

  if (!enterprise) {
    return {
      allowed: false,
      receipts: {
        currentCount: 0,
        limit: null,
        willExceed: true,
        overageCount: 0,
      },
      transactionValue: {
        currentValueCents: 0,
        limitCents: null,
        willExceed: true,
        overageCents: payload.amountCents,
      },
      upgradeRecommendation: null,
    };
  }

  const planTier = normalizePlanTier(enterprise.billingTier);
  const tierMeta = getTierMetaByPlan(planTier);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const aggregate = await prisma.receipt.aggregate({
    where: {
      enterpriseId: payload.enterpriseId,
      createdAt: { gte: monthStart },
    },
    _count: { id: true },
    _sum: { amountCents: true },
  });

  const currentReceiptCount = aggregate._count.id ?? 0;
  const currentValueCents = Number(aggregate._sum.amountCents ?? BigInt(0));

  const receiptLimit = tierMeta.limits.receipts;
  const transactionLimitDollars = tierMeta.limits.transactionValue;
  const transactionLimitCents = transactionLimitDollars != null ? transactionLimitDollars * 100 : null;

  const nextReceiptCount = currentReceiptCount + 1;
  const nextValueCents = currentValueCents + payload.amountCents;

  const willExceedReceipts = receiptLimit != null && nextReceiptCount > receiptLimit;
  const willExceedValue = transactionLimitCents != null && nextValueCents > transactionLimitCents;

  const receiptOverage = receiptLimit != null ? Math.max(nextReceiptCount - receiptLimit, 0) : 0;
  const transactionOverageCents = transactionLimitCents != null ? Math.max(nextValueCents - transactionLimitCents, 0) : 0;

  const allowed = !willExceedReceipts && !willExceedValue;
  const upgradeRecommendation = !allowed
    ? getUpgradeRecommendation(tierMeta.id)
    : shouldSuggestUpgrade(receiptLimit, nextReceiptCount, transactionLimitCents, nextValueCents)
    ? getUpgradeRecommendation(tierMeta.id)
    : null;

  return {
    allowed,
    receipts: {
      currentCount: currentReceiptCount,
      limit: receiptLimit,
      willExceed: willExceedReceipts,
      overageCount: receiptOverage,
    },
    transactionValue: {
      currentValueCents,
      limitCents: transactionLimitCents,
      willExceed: willExceedValue,
      overageCents: transactionOverageCents,
    },
    upgradeRecommendation,
  };
}

function shouldSuggestUpgrade(
  receiptLimit: number | null,
  nextReceipts: number,
  transactionLimitCents: number | null,
  nextValueCents: number,
): boolean {
  const receiptThreshold = receiptLimit != null && receiptLimit > 0 ? nextReceipts / receiptLimit : 0;
  const transactionThreshold =
    transactionLimitCents != null && transactionLimitCents > 0 ? nextValueCents / transactionLimitCents : 0;

  return receiptThreshold >= 0.8 || transactionThreshold >= 0.8;
}

