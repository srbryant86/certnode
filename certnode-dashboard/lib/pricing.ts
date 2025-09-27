import { PlanTier } from "@prisma/client";

export type TierSlug =
  | "foundation"
  | "professional"
  | "enterprise"
  | "legal-shield"
  | "dispute-fortress";

export interface TierLimits {
  receipts: number | null;
  transactionValue: number | null;
  transactionValueUnit: number | null; // value in USD representing billing increment
}

export interface OverageRates {
  receipts: number;
  transactionValue: number;
}

export interface TierMeta {
  id: TierSlug;
  planTier: PlanTier | null;
  name: string;
  pricing: {
    monthly?: number;
    yearly?: number;
  };
  limits: TierLimits;
  overage: OverageRates | null;
  retentionYears: number | null;
  featureHighlights: string[];
}

export interface UpgradeRecommendation {
  targetTier: TierSlug;
  message: string;
  discount?: number | null;
}

const tierMetas: Record<TierSlug, TierMeta> = {
  foundation: {
    id: "foundation",
    planTier: PlanTier.FOUNDATION,
    name: "Foundation",
    pricing: { monthly: 49 },
    limits: {
      receipts: 250,
      transactionValue: 1_000,
      transactionValueUnit: 1_000,
    },
    overage: {
      receipts: 0.5,
      transactionValue: 5,
    },
    retentionYears: 5,
    featureHighlights: [
      "Basic protection",
      "5-year retention",
      "Self-service dashboard",
    ],
  },
  professional: {
    id: "professional",
    planTier: PlanTier.PROFESSIONAL,
    name: "Professional",
    pricing: { monthly: 199 },
    limits: {
      receipts: 1_000,
      transactionValue: 10_000,
      transactionValueUnit: 10_000,
    },
    overage: {
      receipts: 0.25,
      transactionValue: 2,
    },
    retentionYears: 7,
    featureHighlights: [
      "Enhanced metadata",
      "IP tracking",
      "Priority support",
    ],
  },
  enterprise: {
    id: "enterprise",
    planTier: PlanTier.ENTERPRISE,
    name: "Enterprise",
    pricing: { monthly: 499 },
    limits: {
      receipts: 2_500,
      transactionValue: 50_000,
      transactionValueUnit: 50_000,
    },
    overage: {
      receipts: 0.15,
      transactionValue: 1,
    },
    retentionYears: 10,
    featureHighlights: [
      "Compliance reporting",
      "10-year retention",
      "Priority SLA",
    ],
  },
  "legal-shield": {
    id: "legal-shield",
    planTier: PlanTier.LEGAL_SHIELD,
    name: "Legal Shield",
    pricing: { yearly: 12_000 },
    limits: {
      receipts: null,
      transactionValue: null,
      transactionValueUnit: null,
    },
    overage: null,
    retentionYears: 25,
    featureHighlights: [
      "Blockchain anchoring",
      "Legal affidavits",
      "Court-ready exports",
    ],
  },
  "dispute-fortress": {
    id: "dispute-fortress",
    planTier: PlanTier.DISPUTE_FORTRESS,
    name: "Dispute Fortress",
    pricing: { yearly: 30_000 },
    limits: {
      receipts: null,
      transactionValue: null,
      transactionValueUnit: null,
    },
    overage: null,
    retentionYears: null,
    featureHighlights: [
      "White-glove service",
      "Custom branding",
      "Direct channel",
    ],
  },
};

const planToTier: Record<PlanTier, TierSlug> = {
  [PlanTier.STARTER]: "foundation",
  [PlanTier.GROWTH]: "professional",
  [PlanTier.BUSINESS]: "enterprise",
  [PlanTier.ENTERPRISE]: "enterprise",
  [PlanTier.FOUNDATION]: "foundation",
  [PlanTier.PROFESSIONAL]: "professional",
  [PlanTier.LEGAL_SHIELD]: "legal-shield",
  [PlanTier.DISPUTE_FORTRESS]: "dispute-fortress",
};

const upgradeRecommendations: Partial<Record<TierSlug, UpgradeRecommendation>> = {
  foundation: {
    targetTier: "professional",
    message: "Unlock Professional for greater transaction headroom (save 60%)",
    discount: 0.6,
  },
  professional: {
    targetTier: "enterprise",
    message: "Enterprise unlocks compliance tooling and higher transaction ceilings",
    discount: 0.4,
  },
  enterprise: {
    targetTier: "legal-shield",
    message: "Legal Shield eliminates all limits and adds litigation support",
  },
};

export function getTierMetaBySlug(slug: TierSlug): TierMeta {
  return tierMetas[slug];
}

export function getTierMetaByPlan(plan: PlanTier | null | undefined): TierMeta {
  const slug = plan ? planToTier[plan] : "foundation";
  return tierMetas[slug] ?? tierMetas.foundation;
}

export function mapLegacyTier(legacy: string | null | undefined): TierSlug {
  switch (legacy) {
    case "starter":
      return "foundation";
    case "growth":
      return "professional";
    case "business":
      return "enterprise";
    default:
      return "foundation";
  }
}

export function getUpgradeRecommendation(slug: TierSlug): UpgradeRecommendation | null {
  return upgradeRecommendations[slug] ?? null;
}

export function listTierMetas(): TierMeta[] {
  return Object.values(tierMetas);
}
