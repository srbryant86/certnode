import { PlanTier } from "@prisma/client";

export function normalizePlanTier(plan: PlanTier | null | undefined): PlanTier {
  if (!plan) {
    return PlanTier.FOUNDATION;
  }

  switch (plan) {
    case PlanTier.STARTER:
      return PlanTier.FOUNDATION;
    case PlanTier.GROWTH:
      return PlanTier.PROFESSIONAL;
    case PlanTier.BUSINESS:
      return PlanTier.ENTERPRISE;
    default:
      return plan;
  }
}

export function getBillingPortalUrl(): string | null {
  return process.env.STRIPE_CUSTOMER_PORTAL_URL ?? null;
}

export function formatBillingCycle(plan: PlanTier): "monthly" | "yearly" | "custom" {
  if (plan === PlanTier.LEGAL_SHIELD || plan === PlanTier.DISPUTE_FORTRESS) {
    return "yearly";
  }

  return "monthly";
}
