interface ROIInputs {
  ticket: number;
  monthlySales: number;
  disputeRatePct: number;
  deflectionRatePct: number;
  planPriceMonthly: number;
}

interface ROIOutputs {
  monthlyDisputes: number;
  deflectedDisputes: number;
  monthlySavings: number;
  annualSavings: number;
  disputesToPayPlan: number;
  effectiveROI: number;
  isHighTicket: boolean;
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates ROI metrics for dispute protection
 */
export function calculateROI({
  ticket,
  monthlySales,
  disputeRatePct,
  deflectionRatePct,
  planPriceMonthly
}: ROIInputs): ROIOutputs {
  // Clamp inputs to reasonable ranges
  const clampedTicket = clamp(ticket, 0, 1000000);
  const clampedMonthlySales = clamp(monthlySales, 0, 100000);
  const clampedDisputeRate = clamp(disputeRatePct, 0, 100);
  const clampedDeflectionRate = clamp(deflectionRatePct, 10, 60);
  const clampedPlanPrice = Math.max(0, planPriceMonthly);

  // Core calculations
  const monthlyDisputes = clampedMonthlySales * (clampedDisputeRate / 100);
  const deflectedDisputes = monthlyDisputes * (clampedDeflectionRate / 100);
  const monthlySavings = deflectedDisputes * clampedTicket;
  const annualSavings = monthlySavings * 12;

  // Guard against division by zero
  const disputesToPayPlan = clampedTicket > 0
    ? Math.ceil(clampedPlanPrice / clampedTicket)
    : 0;

  // Calculate effective ROI (annual savings / annual plan cost)
  const annualPlanCost = clampedPlanPrice * 12;
  const effectiveROI = annualPlanCost > 0
    ? (annualSavings / annualPlanCost) - 1
    : 0;

  // Determine if this is high-ticket territory
  const isHighTicket = clampedTicket >= 1000;

  return {
    monthlyDisputes: Math.round(monthlyDisputes * 100) / 100,
    deflectedDisputes: Math.round(deflectedDisputes * 100) / 100,
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),
    disputesToPayPlan,
    effectiveROI: Math.round(effectiveROI * 10000) / 100, // Convert to percentage with 2 decimal places
    isHighTicket
  };
}

/**
 * Generates recommendation text based on ROI calculations
 */
export function getROIRecommendation(roi: ROIOutputs, planName: string): string {
  if (roi.effectiveROI > 300) {
    return `${planName} pays for itself with just ${roi.disputesToPayPlan} prevented disputes. This is a no-brainer investment.`;
  } else if (roi.effectiveROI > 100) {
    return `${planName} delivers strong ROI. You'll break even after ${roi.disputesToPayPlan} prevented disputes.`;
  } else if (roi.effectiveROI > 0) {
    return `${planName} provides positive ROI over time. Consider the peace of mind value beyond pure savings.`;
  } else {
    return roi.isHighTicket
      ? "Consider our High-Ticket Dispute Protection plans for better value alignment."
      : "Calculator is tuned for high-ticket offers. Results may be more favorable with larger transaction values.";
  }
}

/**
 * Format currency amounts consistently
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage with appropriate precision
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}