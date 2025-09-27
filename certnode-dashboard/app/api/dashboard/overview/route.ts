import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const metrics = await getDashboardOverview(session.user.enterpriseId);

  return NextResponse.json({
    ...metrics,
    recentActivity: metrics.recentActivity.map((item) => ({
      ...item,
      timestamp: item.timestamp.toISOString(),
    })),
  });
}
