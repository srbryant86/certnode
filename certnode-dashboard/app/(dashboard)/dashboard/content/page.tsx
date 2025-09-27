import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listContentReceipts, type ContentReceiptFilter } from "@/lib/content-receipts";
import { VerificationStatus } from "@prisma/client";
import { ContentReceiptsClient } from "./_components/content-receipts-client";

interface ContentPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const statusMap = new Map(
  Object.values(VerificationStatus).map((status) => [status.toLowerCase(), status]),
);

export default async function ContentPage({ searchParams = {} }: ContentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.enterpriseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Content Authenticity</h1>
        <p className="text-sm text-slate-400">
          Connect an enterprise workspace to review content certification receipts and AI detection results.
        </p>
      </div>
    );
  }

  const filter = toContentFilter(searchParams);
  const result = await listContentReceipts(session.user.enterpriseId, filter);

  const initialData = {
    ...result,
    receipts: result.receipts.map((receipt) => ({
      ...receipt,
      createdAt: receipt.createdAt.toISOString(),
    })),
  };

  const initialFilter = {
    search: filter.search ?? "",
    contentTypes: filter.contentTypes ?? [],
    statuses: filter.statuses?.map((status) => status.toLowerCase()) ?? [],
    from: filter.from ? filter.from.toISOString().slice(0, 10) : "",
    to: filter.to ? filter.to.toISOString().slice(0, 10) : "",
    minConfidence: filter.minConfidence?.toString() ?? "",
    maxConfidence: filter.maxConfidence?.toString() ?? "",
    sortBy: filter.sortBy,
    sortOrder: filter.sortOrder,
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? 25,
  };

  return (
    <ContentReceiptsClient
      initialData={initialData}
      initialFilter={initialFilter}
    />
  );
}

function toContentFilter(params: Record<string, string | string[] | undefined>): ContentReceiptFilter {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Number(get("page")) || 1;
  const pageSize = Number(get("pageSize")) || 25;
  const search = get("search") ?? undefined;
  const from = get("from");
  const to = get("to");
  const minConfidence = get("minConfidence");
  const maxConfidence = get("maxConfidence");
  const sortByParam = get("sortBy");
  const sortOrderParam = get("sortOrder");
  const statusesParam = get("status");
  const contentTypesParam = get("contentType");

  const statuses = statusesParam
    ? statusesParam
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .map((value) => statusMap.get(value))
        .filter((value): value is VerificationStatus => Boolean(value))
    : undefined;

  const contentTypes = contentTypesParam
    ? contentTypesParam.split(",").map((value) => value.trim())
    : undefined;

  return {
    search,
    contentTypes,
    statuses,
    from: from ? new Date(from) : null,
    to: to ? new Date(to) : null,
    minConfidence: minConfidence ? Number(minConfidence) : null,
    maxConfidence: maxConfidence ? Number(maxConfidence) : null,
    page,
    pageSize,
    sortBy: sortByParam === "confidence" ? "confidence" : "createdAt",
    sortOrder: sortOrderParam === "asc" ? "asc" : "desc",
  };
}