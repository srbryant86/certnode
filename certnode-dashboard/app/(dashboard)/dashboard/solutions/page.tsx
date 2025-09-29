import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SolutionsClient } from "./_components/solutions-client";

export default async function SolutionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Industry Solutions</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to access industry-specific intelligence solutions.
        </p>
      </div>
    );
  }

  return <SolutionsClient enterpriseId={session.user.enterpriseId} />;
}