import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IntelligenceClient } from "./_components/intelligence-client";

export default async function IntelligencePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Tri-Pillar Intelligence</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to access real-time intelligence monitoring across content, transactions, and operations.
        </p>
      </div>
    );
  }

  return <IntelligenceClient enterpriseId={session.user.enterpriseId} />;
}