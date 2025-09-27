'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

const ENTERPRISE_KEY = 'certnode_enterprise_calc';
const ENTERPRISE_INTERACTION_KEY = 'certnode_enterprise_calc_interacted';
const LEGACY_ROI_KEY = 'certnode_roi_settings';
const LEGACY_INTERACTION_KEY = 'certnode_roi_interacted';

type RecommendationPayload = {
  monthlyReceipts: number;
  averageDisputeCost: number;
  handlingCost: number;
  projectedAnnualSavings: number;
  planId: string;
  deflectionRate?: number;
};

type LegacyPayload = {
  ticket?: number;
  monthlySales?: number;
};

export default function PlanRecommendation() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const enterpriseSeen = window.localStorage.getItem(ENTERPRISE_INTERACTION_KEY) === 'true';
    if (enterpriseSeen) {
      const stored = window.localStorage.getItem(ENTERPRISE_KEY);
      if (stored) {
        try {
          const parsed: RecommendationPayload = JSON.parse(stored);
          const recommendation = buildEnterpriseMessage(parsed);
          if (recommendation) {
            setMessage(recommendation);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse enterprise calculator payload', error);
        }
      }
    }

    const legacySeen = window.localStorage.getItem(LEGACY_INTERACTION_KEY) === 'true';
    if (legacySeen) {
      const legacyData = window.localStorage.getItem(LEGACY_ROI_KEY);
      if (legacyData) {
        try {
          const parsed: LegacyPayload = JSON.parse(legacyData);
          const recommendation = buildLegacyMessage(parsed.ticket ?? 0, parsed.monthlySales ?? 0);
          if (recommendation) {
            setMessage(recommendation);
          }
        } catch (error) {
          console.warn('Failed to parse legacy ROI payload', error);
        }
      }
    }
  }, []);

  if (!message) return null;

  return (
    <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-200 text-xl">💡</div>
        <div>
          <h3 className="text-lg font-semibold text-yellow-800">Recommended Next Step</h3>
          <p className="mt-2 text-sm text-yellow-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

function buildEnterpriseMessage(payload: RecommendationPayload): string | null {
  const { monthlyReceipts, projectedAnnualSavings, planId } = payload;
  const formattedSavings = formatCurrency(projectedAnnualSavings, 'USD');
  const receipts = new Intl.NumberFormat('en-US').format(monthlyReceipts);

  if (planId === 'enterprise') {
    return `You process roughly ${receipts} receipts each month. Engage our enterprise team at contact@certnode.io to activate a custom rollout - you're positioned to unlock ${formattedSavings} in annual savings.`;
  }

  if (planId === 'business') {
    return `With about ${receipts} receipts monthly, the Business plan unlocks ${formattedSavings} in annual savings and enterprise-grade compliance out of the box.`;
  }

  if (planId === 'growth') {
    return `Your current volume (~${receipts} receipts monthly) maps to the Growth plan. Expect roughly ${formattedSavings} in annual savings once receipts are automated.`;
  }

  if (planId === 'starter') {
    return `You're in a sweet spot for the Starter plan. Automating ${receipts} receipts each month translates to ${formattedSavings} in projected annual savings.`;
  }

  return null;
}

function buildLegacyMessage(ticket: number, monthlySales: number): string | null {
  if (!ticket || !monthlySales) return null;

  if (monthlySales <= 100 && ticket < 1000) {
    return 'Based on your transaction volume, the Starter plan should cover your needs perfectly.';
  }

  if (monthlySales <= 600 || (ticket >= 1000 && ticket <= 5000)) {
    return 'The Growth plan is ideal for your business size and transaction values.';
  }

  if (monthlySales >= 100 && ticket >= 5000) {
    return 'Consider our High-Ticket Dispute Protection plans for maximum value with high-value transactions.';
  }

  return 'The Business plan offers the best value for your transaction volume.';
}
