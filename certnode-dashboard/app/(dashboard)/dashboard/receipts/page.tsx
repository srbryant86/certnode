import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listReceipts, type ReceiptFilter } from "@/lib/receipts";
import { ReceiptsClient } from "./_components/receipts-client";
import { VerificationStatus } from "@prisma/client";

interface ReceiptsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const statusMap = new Map(
  Object.values(VerificationStatus).map((status) => [status.toLowerCase(), status]),
);

export default async function ReceiptsPage({ searchParams = {} }: ReceiptsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Receipts</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to review cryptographic receipts and verification history.
        </p>
      </div>
    );
  }

  const filter = toFilter(searchParams);
  const result = await listReceipts(session.user.enterpriseId, filter);

  const initialData = {
    ...result,
    receipts: result.receipts.map((receipt) => ({
      ...receipt,
      createdAt: receipt.createdAt.toISOString(),
    })),
  };

  const initialFilter = {
    search: filter.search ?? "",
    statuses: filter.statuses?.map((status) => status.toLowerCase()) ?? [],
    from: filter.from ? filter.from.toISOString().slice(0, 10) : "",
    to: filter.to ? filter.to.toISOString().slice(0, 10) : "",
    minAmount: filter.minAmountCents != null ? (filter.minAmountCents / 100).toString() : "",
    maxAmount: filter.maxAmountCents != null ? (filter.maxAmountCents / 100).toString() : "",
    sortBy: filter.sortBy,
    sortOrder: filter.sortOrder,
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? 25,
  };

  return (
    <ReceiptsClient
      initialData={initialData}
      initialFilter={initialFilter}
    />
  );
}

function toFilter(params: Record<string, string | string[] | undefined>): ReceiptFilter {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Number(get("page")) || 1;
  const pageSize = Number(get("pageSize")) || 25;
  const search = get("search") ?? undefined;
  const from = get("from");
  const to = get("to");
  const minAmount = get("minAmount");
  const maxAmount = get("maxAmount");
  const sortByParam = get("sortBy");
  const sortOrderParam = get("sortOrder");
  const statusesParam = get("status");

  const statuses = statusesParam
    ? statusesParam
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .map((value) => statusMap.get(value))
        .filter((value): value is VerificationStatus => Boolean(value))
    : undefined;

  return {
    search,
    statuses,
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
    minAmountCents: minAmount ? Math.floor(Number(minAmount) * 100) : null,
    maxAmountCents: maxAmount ? Math.floor(Number(maxAmount) * 100) : null,
    page,
    pageSize,
    sortBy: sortByParam === "amount" ? "amount" : "createdAt",
    sortOrder: sortOrderParam === "asc" ? "asc" : "desc",
  };
}

