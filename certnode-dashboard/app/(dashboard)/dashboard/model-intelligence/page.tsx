import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModelIntelligenceClient } from "./_components/model-intelligence-client";

export default async function ModelIntelligencePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Advanced Model Intelligence</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to access AI model detection and competitive analysis.
        </p>
      </div>
    );
  }

  return <ModelIntelligenceClient enterpriseId={session.user.enterpriseId} />;
}