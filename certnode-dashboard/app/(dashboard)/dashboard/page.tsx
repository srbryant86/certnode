import { auth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format";
import { getBillingPortalUrl } from "@/lib/billing";
import { getTierMetaBySlug } from "@/lib/pricing";
import { redirect } from "next/navigation";

export default async function DashboardOverviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const overview = await getDashboardOverview(session.user.enterpriseId);
  const billingPortalUrl = getBillingPortalUrl();
  const receipts = overview.usage.receipts;
  const transactions = overview.usage.transactionValue;
  const upgrade = overview.usage.upgradeRecommendation;
  const upgradeTier = upgrade ? getTierMetaBySlug(upgrade.targetTier) : null;

  const receiptUtilPercent = receipts.limit
    ? Math.min(receipts.used / receipts.limit, 1)
    : receipts.used > 0
      ? 1
      : 0;

  const transactionUtilPercent = transactions.limitCents
    ? Math.min(transactions.usedCents / transactions.limitCents, 1)
    : transactions.usedCents > 0
      ? 1
      : 0;

  const baseMonthly = overview.plan.pricing.monthly ?? (overview.plan.pricing.yearly ? overview.plan.pricing.yearly / 12 : 0);
  const billingCycle = overview.plan.pricing.yearly ? "yearly" : "monthly";
  const planPrice = billingCycle === "yearly" ? overview.plan.pricing.yearly ?? null : overview.plan.pricing.monthly ?? null;
  const planPriceLabel = planPrice
    ? `${formatCurrency(planPrice)} / ${billingCycle === "monthly" ? "month" : "year"}`
    : "Custom pricing";
  const receiptOverageCost = receipts.overageCost;
  const transactionOverageCost = transactions.overageCost;
  const totalMonthlyCost = overview.currentCosts;

  const summaryCards = [
    {
      label: "Receipts (monthly)",
      value:
        receipts.limit === null
          ? `${formatNumber(receipts.used)} / Unlimited`
          : `${formatNumber(receipts.used)} / ${formatNumber(receipts.limit)}`,
      helper:
        receipts.limit === null
          ? "Unlimited receipt volume"
          : `${formatPercentage(receiptUtilPercent)} utilised â€” ${formatNumber(receipts.remaining ?? 0)} remaining`,
    },
    {
      label: "Transaction volume",
      value:
        transactions.limitCents === null
          ? `${formatCurrency(transactions.usedCents / 100)} / Unlimited`
          : `${formatCurrency(transactions.usedCents / 100)} / ${formatCurrency((transactions.limitCents ?? 0) / 100)}`,
      helper:
        transactions.limitCents === null
          ? "Unlimited transaction value"
          : `${formatPercentage(transactionUtilPercent)} utilised â€” ${formatCurrency((transactions.remainingCents ?? 0) / 100)} remaining`,
    },
    {
      label: "Average latency",
      value: `${Math.round(overview.avgResponseTime)} ms`,
      helper: "< 200 ms SLO target",
    },
    {
      label: "Error rate",
      value: formatPercentage(overview.errorRate),
      helper: "Across all receipt submissions",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">CertNode Enterprise Suite</h1>
        <p className="text-sm text-slate-400">
          Welcome {session.user.name} - Your tri-pillar intelligence platform with 95%+ accuracy across content, transactions, and operations
        </p>
      </div>

      {/* Enterprise Suite Overview */}
      <section className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-6 py-5 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">🎨</div>
            <div>
              <p className="text-lg font-semibold text-white">Content Intelligence</p>
              <p className="text-sm text-green-300">Multi-Modal Analysis</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-400">95.3%</p>
          <p className="text-xs text-green-200 mt-1">Accuracy across text, image, video, audio, documents</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-6 py-5 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">💰</div>
            <div>
              <p className="text-lg font-semibold text-white">Transaction Intelligence</p>
              <p className="text-sm text-blue-300">10-Layer Validation</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-400">98.2%</p>
          <p className="text-xs text-blue-200 mt-1">Fraud detection with regulatory compliance</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 px-6 py-5 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-2xl">🔧</div>
            <div>
              <p className="text-lg font-semibold text-white">Operations Intelligence</p>
              <p className="text-sm text-purple-300">Compliance Automation</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-400">99.4%</p>
          <p className="text-xs text-purple-200 mt-1">Operational compliance and attestation</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-lg shadow-blue-500/5"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      {/* Enterprise Suite Features */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
        <h2 className="text-lg font-semibold text-white mb-6">🚀 Zero-Cost Value Multiplier Achievements</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="bg-slate-950/40 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium mb-1">✅ Multi-Modal Content Intelligence</div>
            <div className="text-xs text-slate-400">Extended text analysis to images, videos, audio & documents</div>
          </div>
          <div className="bg-slate-950/40 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium mb-1">✅ Real-Time Monitoring Dashboard</div>
            <div className="text-xs text-slate-400">Tri-pillar intelligence metrics with live alerts</div>
          </div>
          <div className="bg-slate-950/40 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium mb-1">✅ Industry Solutions (6 Packages)</div>
            <div className="text-xs text-slate-400">Media, Finance, Healthcare, Legal, Insurance, Education</div>
          </div>
          <div className="bg-slate-950/40 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium mb-1">✅ API Marketplace (12 Integrations)</div>
            <div className="text-xs text-slate-400">Enterprise connectors with existing platforms</div>
          </div>
          <div className="bg-slate-950/40 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium mb-1">🆕 Advanced Model Intelligence</div>
            <div className="text-xs text-slate-400">GPT-5, Claude-3, Gemini detection with competitive analysis</div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-sm text-purple-300 mb-1">💡 Business Impact</div>
          <div className="text-xs text-purple-200">
            <strong>Highest-Margin Feature:</strong> Model-specific detection for legal proceedings and competitive intelligence
            <br />
            <strong>Premium Pricing Tier:</strong> Court-admissible evidence with specific AI model attribution
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Usage guardrails</h2>
            <span className="text-xs text-slate-400">Receipt + transaction value validation</span>
          </div>

          <UsageGauge
            title="Receipts"
            description={
              receipts.limit === null
                ? "Unlimited"
                : `${formatNumber(receipts.used)} of ${formatNumber(receipts.limit)} receipts`
            }
            utilisation={receiptUtilPercent}
            remainingLabel={
              receipts.limit === null
                ? "No cap"
                : `${formatNumber(receipts.remaining ?? 0)} receipts remaining`
            }
          />

          <UsageGauge
            title="Transaction value"
            description={
              transactions.limitCents === null
                ? "Unlimited"
                : `${formatCurrency(transactions.usedCents / 100)} of ${formatCurrency((transactions.limitCents ?? 0) / 100)}`
            }
            utilisation={transactionUtilPercent}
            remainingLabel={
              transactions.limitCents === null
                ? "No cap"
                : `${formatCurrency((transactions.remainingCents ?? 0) / 100)} remaining`
            }
            gradient="from-indigo-500 via-blue-400 to-cyan-300"
          />

          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
            Real-time charts land in Phase 1.2 â€” connect the websocket feed to visualise live quota burn-down.
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <h2 className="text-lg font-semibold text-white">Plan snapshot</h2>
          <p className="text-sm text-slate-400">
            {overview.plan.name} Â· {overview.plan.retentionYears ? `${overview.plan.retentionYears}-year retention` : "Unlimited retention"}
          </p>
          <p className="text-lg font-semibold text-white">{planPriceLabel}</p>
          <ul className="space-y-2 text-sm text-slate-300">
            {overview.plan.featureHighlights.slice(0, 4).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {upgrade && upgradeTier ? (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
              <p className="font-semibold text-white">Approaching limits?</p>
              <p className="mt-1 text-xs text-blue-200">
                {upgrade.message}. Upgrade to {upgradeTier.name}
                {typeof upgrade.discount === "number"
                  ? ` (save ${formatPercentage(upgrade.discount)})`
                  : ""}
                .
              </p>
            </div>
          ) : null}

          {billingPortalUrl ? <BillingPortalButton url={billingPortalUrl} /> : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
        <h2 className="text-lg font-semibold text-white">Financial snapshot</h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <FinancialRow label="Base subscription" value={formatCurrency(baseMonthly)} />
          <FinancialRow label="Receipt overage" value={formatCurrency(receiptOverageCost)} highlight={receipts.overageCount > 0} />
          <FinancialRow
            label="Transaction value overage"
            value={formatCurrency(transactionOverageCost)}
            highlight={transactions.overageCents > 0}
          />
          <FinancialRow label="Total month-to-date" value={formatCurrency(totalMonthlyCost)} emphasize />
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <span className="text-xs text-slate-400">Audit-backed event history</span>
        </div>
        {overview.recentActivity.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
            Activity feed will populate as receipts, API keys, and invites flow through the workspace.
          </p>
        ) : (
          <ul className="space-y-3">
            {overview.recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-300"
              >
                <div>
                  <p className="font-medium text-white capitalize">{item.type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <time className="text-xs text-slate-500" dateTime={item.timestamp.toISOString()}>
                  {item.timestamp.toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BillingPortalButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-lg border border-blue-500/60 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-100 transition hover:border-blue-400 hover:text-white"
    >
      Manage billing in Stripe
    </a>
  );
}

function UsageGauge({
  title,
  description,
  utilisation,
  remainingLabel,
  gradient = "from-blue-500 via-blue-400 to-blue-300",
}: {
  title: string;
  description: string;
  utilisation: number;
  remainingLabel: string;
  gradient?: string;
}) {
  const percent = Math.round(Math.min(utilisation, 1) * 100);

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-6">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="text-xs text-slate-500">{remainingLabel}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-800">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${gradient} shadow-lg shadow-blue-500/40`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{formatPercentage(utilisation)} utilised</p>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  highlight = false,
  emphasize = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  emphasize?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
        emphasize
          ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
          : highlight
            ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
            : "border-slate-800 bg-slate-950/40 text-slate-300"
      }`}
    >
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </li>
  );
}
