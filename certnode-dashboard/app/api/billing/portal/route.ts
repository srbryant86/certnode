import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: session.user.enterpriseId },
      select: {
        id: true,
        name: true,
        subscriptionId: true,
      },
    });

    if (!enterprise) {
      return NextResponse.json({ error: "enterprise_not_found" }, { status: 404 });
    }

    const basePortalUrl = process.env.STRIPE_CUSTOMER_PORTAL_URL;
    if (!basePortalUrl) {
      return NextResponse.json({ error: "portal_unavailable" }, { status: 503 });
    }

    let portalUrl: string;
    try {
      const url = new URL(basePortalUrl);
      if (enterprise.subscriptionId) {
        url.searchParams.set("subscription", enterprise.subscriptionId);
      }
      if (session.user.email) {
        url.searchParams.set("prefilled_email", session.user.email);
      }
      portalUrl = url.toString();
    } catch {
      // Base URL may be a Payment Link path; fall back to returning as-is.
      portalUrl = basePortalUrl;
    }

    await prisma.auditLog.create({
      data: {
        enterpriseId: enterprise.id,
        userId: session.user.id,
        action: "billing.portal_requested",
        resourceType: "billing_portal",
        resourceId: enterprise.subscriptionId ?? "portal",
        details: {
          email: session.user.email,
        },
      },
    });

    return NextResponse.json({ url: portalUrl });
  } catch {
    console.error("billing portal error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
