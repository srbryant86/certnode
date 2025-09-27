import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceiptDetail, verifyReceiptProof } from "@/lib/receipts";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const detail = await getReceiptDetail(session.user.enterpriseId, context.params.id);

  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = verifyReceiptProof(detail);

  return NextResponse.json(result);
}
