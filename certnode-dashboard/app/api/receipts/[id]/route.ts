import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptDetail } from "@/lib/receipts";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = context.params;
  const detail = await getReceiptDetail(session.user.enterpriseId, id);

  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ...detail,
    createdAt: detail.createdAt.toISOString(),
    cryptographicProof: {
      ...detail.cryptographicProof,
      issuedAt: detail.cryptographicProof.issuedAt.toISOString(),
    },
  });
}
