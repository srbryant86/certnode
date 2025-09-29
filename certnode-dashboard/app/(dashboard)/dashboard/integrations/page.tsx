import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IntegrationsClient } from "./_components/integrations-client";

export default async function IntegrationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Enterprise Integrations</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to access the API marketplace and enterprise connectors.
        </p>
      </div>
    );
  }

  return <IntegrationsClient enterpriseId={session.user.enterpriseId} />;
}