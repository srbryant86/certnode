import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnterpriseAnalytics from "@/components/dashboard/enterprise-analytics";
import PlatformAnalytics from "@/components/dashboard/platform-analytics";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's API key for analytics access
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      enterpriseId: session.user.enterpriseId,
      revokedAt: null
    },
    select: {
      key: true
    }
  });

  if (!apiKey) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-slate-400">
            Advanced usage analytics and reporting for enterprise insights.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">API Key Required</h2>
          <p className="text-sm text-slate-400 mb-4">
            You need an active API key to access analytics data.
          </p>
          <a
            href="/dashboard/api"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Generate API Key
          </a>
        </div>
      </div>
    );
  }

  // Check if user is admin for platform analytics
  const enterprise = await prisma.enterprise.findUnique({
    where: { id: session.user.enterpriseId },
    select: { tier: true, name: true }
  });

  const isAdmin = enterprise?.tier === 'ENTERPRISE'; // Only enterprise users get platform analytics

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-slate-400">
          Advanced usage analytics and reporting for enterprise insights.
        </p>
      </div>

      {isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">Platform Analytics</h2>
            <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
              Admin Only
            </span>
          </div>
          <PlatformAnalytics apiKey={apiKey.key} />
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Enterprise Analytics</h2>
        <EnterpriseAnalytics
          enterpriseId={session.user.enterpriseId}
          apiKey={apiKey.key}
        />
      </div>
    </div>
  );
}