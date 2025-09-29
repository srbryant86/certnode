import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_EXPORT = 500;

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const idsParam = searchParams.get("ids");
  const search = searchParams.get("search");

  const where: any = {
    enterpriseId: session.user.enterpriseId,
  };

  if (idsParam) {
    const ids = idsParam.split(",").map((value) => value.trim()).filter(Boolean);
    where.id = { in: ids };
  }

  if (search && !idsParam) {
    where.OR = [
      { transactionId: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  const receipts = await prisma.receipt.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT,
  });

  const serialized = receipts.map((receipt) => ({
    id: receipt.id,
    transactionId: receipt.transactionId,
    currency: receipt.currency,
    status: receipt.verificationStatus,
    createdAt: receipt.createdAt.toISOString(),
    transactionData: receipt.transactionData,
  }));

  if (format === "json") {
    return new NextResponse(JSON.stringify(serialized, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=receipts.json",
      },
    });
  }

  const header = "id,transaction_id,currency,status,created_at";
  const rows = serialized.map((receipt) => {
    const cells = [
      escapeCsv(receipt.id),
      escapeCsv(receipt.transactionId),
      receipt.currency,
      receipt.status,
      receipt.createdAt,
    ];
    return cells.join(",");
  });
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=receipts.csv",
    },
  });
}

function escapeCsv(value: string) {
  if (/,|"/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
