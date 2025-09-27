import { auth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format";
import { redirect } from "next/navigation";

const MONTHLY_QUOTA = 10_000;

export default async function DashboardOverviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const overview = await getDashboardOverview(session.user.enterpriseId);
  const quotaPercent = Math.round(Math.min(overview.quotaUtilization, 1) * 100);

  const summaryCards = [
    {
      label: "Receipts this month",
      value: formatNumber(overview.receiptsThisMonth),
      helper: `${formatPercentage(overview.quotaUtilization)} of monthly quota`,
    },
    {
      label: "Remaining quota",
      value: formatNumber(overview.remainingQuota),
      helper: `${formatNumber(MONTHLY_QUOTA)} monthly allowance`,
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

  const financialCards = [
    {
      label: "Current costs",
      value: formatCurrency(overview.currentCosts),
    },
    {
      label: "Projected costs",
      value: formatCurrency(overview.projectedCosts),
    },
    {
      label: "Savings vs. list",
      value: formatCurrency(overview.savings),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Welcome, {session.user.name}</h1>
        <p className="text-sm text-slate-400">
          Track protocol adoption, manage credentials, and monitor billing in real time.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-lg shadow-blue-500/5"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Quota utilization</h2>
            <span className="text-xs text-slate-400">Monthly allocation</span>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
              <span>{formatPercentage(overview.quotaUtilization)}</span>
              <span>{formatNumber(overview.remainingQuota)} remaining</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 shadow-lg shadow-blue-500/40"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {formatNumber(MONTHLY_QUOTA)} receipts per billing cycle
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
            Usage charts land in Phase 1.2 -- hook up real-time vector streams for quota burn-down.
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <h2 className="text-lg font-semibold text-white">Financial snapshot</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            {financialCards.map((card) => (
              <li key={card.label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <span>{card.label}</span>
                <span className="font-semibold text-white">{card.value}</span>
              </li>
            ))}
          </ul>
        </div>
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
