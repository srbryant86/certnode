import { EnterpriseTier } from "@prisma/client";

export function normalizePlanTier(plan: EnterpriseTier | null | undefined): EnterpriseTier {
  if (!plan) {
    return EnterpriseTier.FREE;
  }

  return plan;
}

export function getBillingPortalUrl(): string | null {
  return process.env.STRIPE_CUSTOMER_PORTAL_URL ?? null;
}

export function formatBillingCycle(plan: EnterpriseTier): "monthly" | "yearly" | "custom" {
  if (plan === EnterpriseTier.ENTERPRISE) {
    return "yearly";
  }

  return "monthly";
}
