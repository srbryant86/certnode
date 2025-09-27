import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardOverview } from "@/lib/dashboard";
import { getApiKeysForEnterprise, revokeApiKeyFormAction } from "./actions";
import { CreateApiKeyForm } from "./_components/create-api-key-form";
import { RevokeApiKeyButton } from "./_components/revoke-api-key-button";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { KeyStatus } from "@prisma/client";

export default async function ApiKeyManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const enterpriseId = session.user.enterpriseId;

  if (!enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">API keys</h1>
        <p className="text-sm text-slate-400">
          Connect your first enterprise workspace before managing API keys.
        </p>
      </div>
    );
  }

  const [overview, apiKeys] = await Promise.all([
    getDashboardOverview(enterpriseId),
    getApiKeysForEnterprise(enterpriseId),
  ]);

  const planLimit = overview.usage.receipts.limit;
  const planLimitLabel = planLimit === null ? "Unlimited" : formatNumber(planLimit);
  const receiptUtilPercent = planLimit
    ? Math.min(overview.usage.receipts.used / planLimit, 1)
    : overview.usage.receipts.used > 0
      ? 1
      : 0;
  const transactionLimitCents = overview.usage.transactionValue.limitCents;
  const transactionLimitLabel =
    transactionLimitCents === null
      ? "Unlimited"
      : formatCurrency(transactionLimitCents / 100);
  const transactionUtilPercent = transactionLimitCents
    ? Math.min(overview.usage.transactionValue.usedCents / transactionLimitCents, 1)
    : overview.usage.transactionValue.usedCents > 0
      ? 1
      : 0;

  const totalMonthlyReceipts = overview.usage.receipts.used;
  const keyUsageSeries = apiKeys
    .map((key) => {
      const shareOfLimit = planLimit ? key.monthlyUsageCount / planLimit : 0;
      const shareOfTotal = totalMonthlyReceipts
        ? key.monthlyUsageCount / totalMonthlyReceipts
        : 0;

      return {
        ...key,
        shareOfLimit,
        shareOfTotal,
      };
    })
    .sort((a, b) => b.monthlyUsageCount - a.monthlyUsageCount);

  const topKeys = keyUsageSeries.filter((key) => key.monthlyUsageCount > 0).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">API keys</h1>
        <p className="text-sm text-slate-400">
          Provision and govern access credentials for the CertNode receipt infrastructure.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
        <CreateApiKeyForm />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Plan usage summary</h2>
            <span className="text-xs text-slate-500">Monthly billing view</span>
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <UsageSummaryRow
              label="Receipts"
              value={`${formatNumber(totalMonthlyReceipts)} / ${planLimitLabel}`}
              utilisation={receiptUtilPercent}
            />
            <UsageSummaryRow
              label="Transaction value"
              value={`${formatCurrency(overview.usage.transactionValue.usedCents / 100)} / ${transactionLimitLabel}`}
              utilisation={transactionUtilPercent}
              gradient="from-indigo-500 via-blue-400 to-cyan-300"
            />
            {overview.usage.upgradeRecommendation ? (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-100">
                <p className="font-semibold text-white">Upgrade recommended</p>
                <p className="mt-1 text-blue-200">{overview.usage.upgradeRecommendation.message}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Top keys (monthly)</h2>
            <span className="text-xs text-slate-500">Share of monthly receipts</span>
          </div>
          <div className="mt-4 space-y-3">
            {topKeys.length === 0 ? (
              <p className="text-sm text-slate-400">
                No activity recorded this month. Generate traffic to populate analytics.
              </p>
            ) : (
              topKeys.map((key) => (
                <UsageBar
                  key={key.id}
                  label={key.name}
                  value={formatNumber(key.monthlyUsageCount)}
                  percentage={key.shareOfTotal}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Existing keys</h2>
          <span className="text-xs text-slate-500">Secrets are encrypted at rest; previews only</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Monthly usage</th>
                <th className="px-4 py-3">All-time</th>
                <th className="px-4 py-3">Rate limit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last used</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-sm text-slate-200">
              {apiKeys.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={7}>
                    No API keys yet. Generate one to connect your services.
                  </td>
                </tr>
              ) : (
                keyUsageSeries.map((key) => (
                  <tr key={key.id}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{key.name}</div>
                      <div className="mt-1 font-mono text-xs text-slate-400">
                        {key.keyPreview}
                        <span className="text-slate-600">•••••••</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-white">{formatNumber(key.monthlyUsageCount)}</div>
                      <div className="text-xs text-slate-500">
                        {planLimit
                          ? `${formatPercentage(Math.min(key.shareOfLimit, 1))} of plan`
                          : `${formatPercentage(key.shareOfTotal)} of monthly receipts`}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-white">{formatNumber(key.usageCount)}</div>
                      <div className="text-xs text-slate-500">All-time receipts</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-white">{formatNumber(key.rateLimit)}</div>
                      <div className="text-xs text-slate-500">{labelRateLimitWindow(key.rateLimitWindow)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={key.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-white">
                        {key.lastUsed ? formatDistanceToNow(key.lastUsed, { addSuffix: true }) : "Never"}
                      </div>
                      <div className="text-xs text-slate-500">Created {formatDistanceToNow(key.createdAt, { addSuffix: true })}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {key.status === KeyStatus.REVOKED ? (
                        <span className="text-xs text-slate-500">Revoked</span>
                      ) : (
                        <form action={revokeApiKeyFormAction} className="inline-flex">
                          <input type="hidden" name="apiKeyId" value={key.id} />
                          <RevokeApiKeyButton />
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function UsageSummaryRow({
  label,
  value,
  utilisation,
  gradient = "from-blue-500 via-blue-400 to-blue-300",
}: {
  label: string;
  value: string;
  utilisation: number;
  gradient?: string;
}) {
  const percent = Math.round(Math.min(utilisation, 1) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{formatPercentage(utilisation)} utilised</p>
    </div>
  );
}

function UsageBar({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: number;
}) {
  const percent = Math.round(Math.min(percentage, 1) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-100">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{formatPercentage(percentage)} of monthly receipts</p>
    </div>
  );
}

function labelRateLimitWindow(window: string) {
  switch (window) {
    case "1m":
      return "per minute";
    case "1h":
      return "per hour";
    case "1d":
      return "per day";
    default:
      return window;
  }
}

function StatusBadge({ status }: { status: KeyStatus }) {
  const styles = {
    [KeyStatus.ACTIVE]: "bg-emerald-500/10 text-emerald-200 border-emerald-400/30",
    [KeyStatus.REVOKED]: "bg-red-500/10 text-red-200 border-red-400/30",
    [KeyStatus.EXPIRED]: "bg-amber-500/10 text-amber-200 border-amber-400/30",
  } satisfies Record<KeyStatus, string>;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}
