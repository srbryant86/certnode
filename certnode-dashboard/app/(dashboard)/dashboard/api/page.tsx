import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApiKeysForEnterprise, revokeApiKeyAction } from "./actions";
import { CreateApiKeyForm } from "./_components/create-api-key-form";
import { RevokeApiKeyButton } from "./_components/revoke-api-key-button";
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

  const apiKeys = await getApiKeysForEnterprise(enterpriseId);

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
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Rate limit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last used</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-sm text-slate-200">
              {apiKeys.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={6}>
                    No API keys yet. Generate one to connect your services.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{key.name}</div>
                      <div className="mt-1 font-mono text-xs text-slate-400">
                        {key.keyPreview}
                        <span className="text-slate-600">•••••••</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-white">{key.usageCount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">All-time receipts</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="font-medium text-white">{key.rateLimit.toLocaleString()}</div>
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
                        <form action={revokeApiKeyAction} className="inline-flex">
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
