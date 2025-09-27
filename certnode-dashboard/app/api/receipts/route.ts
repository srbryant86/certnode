import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listReceipts } from "@/lib/receipts";
import { VerificationStatus } from "@prisma/client";

const statusMap = new Map(
  Object.values(VerificationStatus).map((status) => [status.toLowerCase(), status]),
);

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = Number.isNaN(Number(searchParams.get("page"))) ? 1 : Number(searchParams.get("page")) || 1;
  const pageSize = Number.isNaN(Number(searchParams.get("pageSize"))) ? 25 : Number(searchParams.get("pageSize")) || 25;
  const search = searchParams.get("search") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");
  const sortBy = searchParams.get("sortBy") === "amount" ? "amount" : "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const statusesParam = searchParams.get("status");

  const statuses = statusesParam
    ? statusesParam
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .map((value) => statusMap.get(value))
        .filter((value): value is VerificationStatus => Boolean(value))
    : undefined;

  const filter = {
    search,
    statuses,
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
    minAmountCents: minAmount ? Math.floor(Number(minAmount) * 100) : null,
    maxAmountCents: maxAmount ? Math.floor(Number(maxAmount) * 100) : null,
    page,
    pageSize,
    sortBy: sortBy === "amount" ? "amount" : "createdAt",
    sortOrder,
  } as const;

  const result = await listReceipts(session.user.enterpriseId, filter);

  return NextResponse.json({
    ...result,
    receipts: result.receipts.map((receipt) => ({
      ...receipt,
      createdAt: receipt.createdAt.toISOString(),
    })),
  });
}
