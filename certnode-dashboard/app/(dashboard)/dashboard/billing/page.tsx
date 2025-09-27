import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardOverview } from "@/lib/dashboard";
import { getSubscriptionData } from "@/lib/billing-dashboard";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format";
import { BillingPortalButton } from "./_components/billing-portal-button";
import { InvoiceHistory } from "./_components/invoice-history";
import { PlanChangeButton } from "./_components/plan-change-button";
import { changePlanAction } from "./actions";
import type { PlanOption } from "@/types";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Billing &amp; plan</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to access billing controls and plan management.
        </p>
      </div>
    );
  }

  const overviewPromise = getDashboardOverview(session.user.enterpriseId);
  const subscriptionPromise = overviewPromise.then((metrics) =>
    getSubscriptionData(session.user.enterpriseId!, { overview: metrics }),
  );

  const [overview, subscription] = await Promise.all([overviewPromise, subscriptionPromise]);

  const receiptLimit = subscription.currentPlan.receiptsIncluded;
  const receiptLimitLabel = receiptLimit >= Number.MAX_SAFE_INTEGER ? "Unlimited" : formatNumber(receiptLimit);
  const receiptUtilPercent =
    receiptLimit >= Number.MAX_SAFE_INTEGER
      ? 0
      : Math.min(subscription.currentUsage.receiptsUsed / receiptLimit, 1);

  const transactionLimitCents = overview.usage.transactionValue.limitCents;
  const transactionLimitLabel = transactionLimitCents === null
    ? "Unlimited"
    : formatCurrency((transactionLimitCents ?? 0) / 100);
  const transactionUtilPercent = transactionLimitCents
    ? Math.min(overview.usage.transactionValue.usedCents / transactionLimitCents, 1)
    : overview.usage.transactionValue.usedCents > 0
      ? 1
      : 0;

  const baseMonthlyPrice = overview.plan.pricing.monthly ?? (overview.plan.pricing.yearly ? overview.plan.pricing.yearly / 12 : 0);
  const planPriceLabel = subscription.currentPlan.billingCycle === "yearly"
    ? `${formatCurrency(overview.plan.pricing.yearly ?? 0)} / year`
    : `${formatCurrency(baseMonthlyPrice)} / month`;

  const receiptsOverageCost = overview.usage.receipts.overageCost;
  const transactionOverageCost = overview.usage.transactionValue.overageCost;
  const totalOverageCost = receiptsOverageCost + transactionOverageCost;

  const renderPlanOption = (option: PlanOption, intent: "upgrade" | "downgrade") => {
    const receiptsIncludedLabel = option.receiptsIncluded >= Number.MAX_SAFE_INTEGER
      ? "Unlimited receipts"
      : `${formatNumber(option.receiptsIncluded)} receipts`;
    const priceLabel = option.yearlyPrice
      ? `${formatCurrency(option.monthlyPrice)} / mo • ${formatCurrency(option.yearlyPrice)} / yr`
      : `${formatCurrency(option.monthlyPrice)} / mo`;

    return (
      <form
        key={option.tier}
        action={changePlanAction}
        className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3"
      >
        <input type="hidden" name="targetTier" value={option.tier} />
        <div>
          <p className="text-sm font-semibold text-white">{option.tier.toLowerCase().replace(/_/g, " ")}</p>
          <p className="text-xs text-slate-400">{receiptsIncludedLabel}</p>
          <p className="text-xs text-slate-500">Overage {formatCurrency(option.overageRate)} per receipt</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">{priceLabel}</span>
          <PlanChangeButton
            label={intent === "upgrade" ? "Upgrade" : "Downgrade"}
            intent={intent}
          />
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Billing &amp; plan</h1>
        <p className="text-sm text-slate-400">
          Monitor usage, review invoices, and control plan changes for your CertNode infrastructure subscription.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-blue-500/30 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
                {overview.plan.name} plan
              </span>
              <p className="text-3xl font-semibold text-white">{planPriceLabel}</p>
              <p className="text-sm text-slate-400">{overview.plan.featureHighlights.join(" • ")}</p>
            </div>
            <BillingPortalButton />
          </div>

          {subscription.upgradeRecommendation ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold text-white">Upgrade insight</p>
              <p className="mt-1 text-emerald-100">{subscription.upgradeRecommendation.message}</p>
              {subscription.upgradeRecommendation.discount ? (
                <p className="mt-1 text-xs text-emerald-200">
                  Estimated savings {formatPercentage(subscription.upgradeRecommendation.discount)} when moving to {subscription.upgradeRecommendation.targetTier.replace(/_/g, " ")}.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <UsageCard
              title="Receipts"
              value={`${formatNumber(subscription.currentUsage.receiptsUsed)} / ${receiptLimitLabel}`}
              utilisation={receiptUtilPercent}
              helper={
                receiptLimit >= Number.MAX_SAFE_INTEGER
                  ? "Unlimited receipt volume"
                  : `${formatPercentage(receiptUtilPercent)} utilised`
              }
            />
            <UsageCard
              title="Transaction value"
              value={`${formatCurrency(overview.usage.transactionValue.usedCents / 100)} / ${transactionLimitLabel}`}
              utilisation={transactionUtilPercent}
              helper={
                transactionLimitCents === null
                  ? "Unlimited transaction value"
                  : `${formatPercentage(transactionUtilPercent)} utilised`
              }
              gradient="from-indigo-500 via-blue-400 to-cyan-300"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <h2 className="text-lg font-semibold text-white">Plan management</h2>
          <div className="space-y-3 text-sm text-slate-300">
            {subscription.availableUpgrades.length === 0 ? (
              <p className="text-sm text-slate-400">No higher tiers available. Contact support for bespoke arrangements.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Upgrade</p>
                <div className="space-y-2">
                  {subscription.availableUpgrades.map((option) => renderPlanOption(option, "upgrade"))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Downgrade</p>
              {subscription.availableDowngrades.length === 0 ? (
                <p className="text-xs text-slate-500">No downgrade paths currently available.</p>
              ) : (
                <div className="space-y-2">
                  {subscription.availableDowngrades.map((option) => renderPlanOption(option, "downgrade"))}
                </div>
              )}
            </div>

            {subscription.downgradeLimitations.length > 0 ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Downgrade constraints</p>
                <ul className="mt-2 space-y-1 text-xs text-amber-100">
                  {subscription.downgradeLimitations.map((message, index) => (
                    <li key={index}>
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <h2 className="text-lg font-semibold text-white">Cost breakdown</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <CostRow label="Base subscription" value={formatCurrency(baseMonthlyPrice)} helper={subscription.currentPlan.billingCycle === "yearly" ? "Prorated monthly" : "Monthly recurring"} />
            <CostRow label="Receipt overage" value={formatCurrency(receiptsOverageCost)} helper={`${formatNumber(overview.usage.receipts.overageCount)} receipts over limit`} highlight={overview.usage.receipts.overageCount > 0} />
            <CostRow label="Transaction overage" value={formatCurrency(transactionOverageCost)} helper={`${formatCurrency(overview.usage.transactionValue.overageCents / 100)} value over limit`} highlight={overview.usage.transactionValue.overageCents > 0} />
            <CostRow label="Total month-to-date" value={formatCurrency(subscription.currentUsage.currentCosts)} emphasize />
          </ul>
          {totalOverageCost > 0 ? (
            <p className="text-xs text-slate-500">Consider upgrading to reduce ${formatCurrency(totalOverageCost)} in overage charges.</p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <h2 className="text-lg font-semibold text-white">Invoice history</h2>
          <InvoiceHistory invoices={subscription.invoices} />
        </div>
      </section>
    </div>
  );
}

function UsageCard({
  title,
  value,
  utilisation,
  helper,
  gradient = "from-blue-500 via-blue-400 to-blue-300",
}: {
  title: string;
  value: string;
  utilisation: number;
  helper: string;
  gradient?: string;
}) {
  const percent = Math.round(Math.min(utilisation, 1) * 100);

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-white">{title}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function CostRow({
  label,
  value,
  helper,
  highlight = false,
  emphasize = false,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
  emphasize?: boolean;
}) {
  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm ${
        emphasize
          ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
          : highlight
            ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
            : "border-slate-800 bg-slate-950/40 text-slate-300"
      }`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
      {helper ? <p className="mt-1 text-[11px] text-slate-500">{helper}</p> : null}
    </li>
  );
}
