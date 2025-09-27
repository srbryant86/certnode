"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";

type SortByOption = "createdAt" | "amount";
type SortOrderOption = "asc" | "desc";

type SerializableReceipt = {
  id: string;
  transactionId: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  apiKeyName: string;
  transactionData: Record<string, unknown>;
};

type SerializableAnalytics = {
  successRate: number;
  failureRate: number;
  averageAmount: number;
  averageVerificationMs: number;
};

type SerializableResult = {
  receipts: SerializableReceipt[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  analytics: SerializableAnalytics;
};

type ClientFilter = {
  search: string;
  statuses: string[];
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortByOption;
  sortOrder: SortOrderOption;
  page: number;
  pageSize: number;
};

type ReceiptsClientProps = {
  initialData: SerializableResult;
  initialFilter: Partial<ClientFilter> & { statuses: string[] };
};

type ReceiptDetailPayload = {
  id: string;
  transactionId: string;
  amount: { amount: number; currency: string };
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  cryptographicProof: {
    merkleRoot: string;
    signature: string;
    algorithm: string;
    issuedAt: string;
    evidence: Record<string, unknown>;
  };
  apiKey: { id: string; name: string };
};

type ProofVerificationResult = {
  ok: boolean;
  reasons: string[];
};

type DetailState =
  | { status: "idle" }
  | { status: "loading"; id: string }
  | { status: "ready"; receipt: ReceiptDetailPayload; verification: ProofVerificationResult | null }
  | { status: "error"; message: string };

type FilterToolbarProps = {
  filters: ClientFilter;
  onFiltersChange: Dispatch<SetStateAction<ClientFilter>>;
  onToggleStatus: (status: string) => void;
  isPending: boolean;
};

type AnalyticsCardProps = {
  title: string;
  value: string;
  helper: string;
  gradient?: string;
};

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

type ReceiptDetailModalProps = {
  state: DetailState;
  onClose: () => void;
  onVerify: (id: string) => void;
};

type DetailRowProps = {
  label: string;
  value: ReactNode;
};

type KeyValueListProps = {
  data: Record<string, unknown>;
};

const STATUS_OPTIONS = [
  { label: "Verified", value: "verified" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
];

const DEFAULT_FILTER: ClientFilter = {
  search: "",
  statuses: STATUS_OPTIONS.map((option) => option.value),
  from: "",
  to: "",
  minAmount: "",
  maxAmount: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  pageSize: 25,
};
export function ReceiptsClient({ initialData, initialFilter }: ReceiptsClientProps) {
  const initialStatuses =
    initialFilter.statuses && initialFilter.statuses.length > 0
      ? Array.from(new Set(initialFilter.statuses))
      : DEFAULT_FILTER.statuses;

  const [filters, setFilters] = useState<ClientFilter>({
    search: initialFilter.search ?? DEFAULT_FILTER.search,
    statuses: initialStatuses,
    from: initialFilter.from ?? DEFAULT_FILTER.from,
    to: initialFilter.to ?? DEFAULT_FILTER.to,
    minAmount: initialFilter.minAmount ?? DEFAULT_FILTER.minAmount,
    maxAmount: initialFilter.maxAmount ?? DEFAULT_FILTER.maxAmount,
    sortBy: initialFilter.sortBy ?? DEFAULT_FILTER.sortBy,
    sortOrder: initialFilter.sortOrder ?? DEFAULT_FILTER.sortOrder,
    page: initialFilter.page ?? DEFAULT_FILTER.page,
    pageSize: initialFilter.pageSize ?? DEFAULT_FILTER.pageSize,
  });

  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailState, setDetailState] = useState<DetailState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);

  const queryString = useMemo(() => buildQueryString(filters), [filters]);

  const refreshData = useCallback(
    async (quiet = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!quiet) {
        setFetchError(null);
      }

      try {
        const response = await fetch(`/api/receipts${queryString}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as SerializableResult;
        setData(payload);
        if (!quiet) {
          setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => payload.receipts.some((row) => row.id === id))));
        }
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }
        console.error("receipt fetch error", error);
        setFetchError("Unable to load receipts. Try adjusting filters or refreshing.");
      }
    },
    [queryString],
  );

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    startTransition(() => {
      void refreshData();
    });
  }, [filters, refreshData]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshData(true);
    }, 15_000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const toggleStatus = useCallback((value: string) => {
    setFilters((prev) => {
      const next = new Set(prev.statuses);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      const resolved = next.size === 0 ? DEFAULT_FILTER.statuses : Array.from(next);
      return { ...prev, statuses: resolved, page: 1 };
    });
  }, []);

  const handleSelectionChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(data.receipts.map((receipt) => receipt.id)));
  }, [data.receipts]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const openReceipt = useCallback(async (id: string) => {
    setDetailState({ status: "loading", id });
    try {
      const response = await fetch(`/api/receipts/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to load receipt ${id}`);
      }
      const payload = (await response.json()) as ReceiptDetailPayload;
      setDetailState({ status: "ready", receipt: payload, verification: null });
    } catch (error) {
      console.error("receipt detail error", error);
      setDetailState({ status: "error", message: "Unable to load receipt details." });
    }
  }, []);

  const verifyReceipt = useCallback(async (id: string) => {
    setDetailState((prev) => {
      if (prev.status !== "ready" || prev.receipt.id !== id) {
        return prev;
      }
      return { ...prev, verification: { ok: false, reasons: ["Verifying..."] } };
    });

    try {
      const response = await fetch(`/api/receipts/${id}/verify`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Verification request failed");
      }
      const payload = (await response.json()) as ProofVerificationResult;
      setDetailState((prev) => {
        if (prev.status !== "ready" || prev.receipt.id !== id) {
          return prev;
        }
        return { ...prev, verification: payload };
      });
    } catch (error) {
      console.error("receipt verification error", error);
      setDetailState((prev) => {
        if (prev.status !== "ready" || prev.receipt.id !== id) {
          return prev;
        }
        return {
          ...prev,
          verification: { ok: false, reasons: ["Verification failed"] },
        };
      });
    }
  }, []);

  const exportSelected = useCallback(
    (format: "csv" | "json") => {
      const params = new URLSearchParams();
      params.set("format", format);

      const ids = Array.from(selectedIds);
      if (ids.length > 0) {
        params.set("ids", ids.join(","));
      } else if (queryString.startsWith("?")) {
        const current = new URLSearchParams(queryString.slice(1));
        current.forEach((value, key) => {
          params.append(key, value);
        });
      }

      window.open(`/api/receipts/export?${params.toString()}`, "_blank", "noopener,noreferrer");
    },
    [selectedIds, queryString],
  );

  const bulkVerify = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }

    const results: Array<{ id: string; ok: boolean }> = [];
    for (const id of ids) {
      try {
        const response = await fetch(`/api/receipts/${id}/verify`, { method: "POST" });
        if (!response.ok) {
          throw new Error("verify failed");
        }
        const payload = (await response.json()) as ProofVerificationResult;
        results.push({ id, ok: payload.ok });
      } catch (error) {
        console.error("bulk verify failure", error);
        results.push({ id, ok: false });
      }
    }

    await refreshData();
    setDetailState({ status: "idle" });
    setSelectedIds(new Set(results.filter((row) => !row.ok).map((row) => row.id)));
  }, [selectedIds, refreshData]);

  const totalPages = Math.max(1, data.pageCount);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Receipts</h1>
        <p className="text-sm text-slate-400">
          Search, filter, and export cryptographic receipts with live verification insights.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
        <FilterToolbar
          filters={filters}
          onFiltersChange={setFilters}
          onToggleStatus={toggleStatus}
          isPending={isPending}
        />
        {fetchError ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            {fetchError}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Success rate"
          value={formatPercentage(data.analytics.successRate)}
          helper={`${formatNumber(Math.round(data.total * data.analytics.successRate))} verified receipts`}
        />
        <AnalyticsCard
          title="Failure rate"
          value={formatPercentage(data.analytics.failureRate)}
          helper={`${formatNumber(Math.round(data.total * data.analytics.failureRate))} failed verifications`}
          gradient="from-amber-500 via-orange-400 to-red-400"
        />
        <AnalyticsCard
          title="Avg. amount"
          value={formatCurrency(data.analytics.averageAmount)}
          helper="Last filter window"
          gradient="from-emerald-500 via-green-400 to-emerald-300"
        />
        <AnalyticsCard
          title="Avg. verification time"
          value={`${Math.round(data.analytics.averageVerificationMs)} ms`}
          helper="Across successful receipts"
          gradient="from-cyan-500 via-blue-400 to-indigo-400"
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-blue-500/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            {formatNumber(data.total)} receipts • Page {data.page} of {totalPages}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportSelected("csv")}
              className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => exportSelected("json")}
              className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={bulkVerify}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Verify selected
            </button>
            {selectedIds.size > 0 ? (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear selection
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all receipts on this page"
                    checked={selectedIds.size > 0 && selectedIds.size === data.receipts.length}
                    onChange={(event) => {
                      if (event.currentTarget.checked) {
                        handleSelectAll();
                      } else {
                        handleClearSelection();
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Transaction</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
                <th className="px-4 py-3 text-left font-semibold">API key</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {data.receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No receipts match the current filters.
                  </td>
                </tr>
              ) : (
                data.receipts.map((receipt) => {
                  const createdLabel = formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true });
                  return (
                    <tr key={receipt.id} className="hover:bg-slate-900/70">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select receipt ${receipt.id}`}
                          checked={selectedIds.has(receipt.id)}
                          onChange={(event) => handleSelectionChange(receipt.id, event.currentTarget.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{receipt.transactionId}</div>
                        <div className="text-xs text-slate-500">{receipt.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={receipt.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-100">{formatCurrency(receipt.amountCents / 100)}</td>
                      <td className="px-4 py-3 text-slate-200">{createdLabel}</td>
                      <td className="px-4 py-3 text-slate-200">{receipt.apiKeyName}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openReceipt(receipt.id)}
                          className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={filters.page}
          pageCount={totalPages}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      </section>

      <ReceiptDetailModal
        state={detailState}
        onClose={() => setDetailState({ status: "idle" })}
        onVerify={verifyReceipt}
      />
    </div>
  );
}
function buildQueryString(filters: ClientFilter) {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== DEFAULT_FILTER.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.minAmount) params.set("minAmount", filters.minAmount);
  if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
  if (filters.sortBy !== DEFAULT_FILTER.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder !== DEFAULT_FILTER.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.statuses.length && filters.statuses.length !== DEFAULT_FILTER.statuses.length) {
    params.set("status", filters.statuses.join(","));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

function FilterToolbar({ filters, onFiltersChange, onToggleStatus, isPending }: FilterToolbarProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
        <input
          type="search"
          placeholder="Transaction ID or receipt ID"
          value={filters.search}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, search: event.currentTarget.value, page: 1 }))}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Date range</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.from}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, from: event.currentTarget.value, page: 1 }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, to: event.currentTarget.value, page: 1 }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Amount (USD)</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            value={filters.minAmount}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, minAmount: event.currentTarget.value, page: 1 }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            value={filters.maxAmount}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, maxAmount: event.currentTarget.value, page: 1 }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = filters.statuses.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggleStatus(option.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  active ? "border-blue-400/40 bg-blue-500/10 text-blue-100" : "border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
        <div className="mt-1 flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, sortBy: event.currentTarget.value as SortByOption, page: 1 }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <option value="createdAt">Newest</option>
            <option value="amount">Amount</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, sortOrder: event.currentTarget.value as SortOrderOption, page: 1 }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Page size</label>
        <select
          value={filters.pageSize}
          disabled={isPending}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, pageSize: Number(event.currentTarget.value), page: 1 }))}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AnalyticsCard({ title, value, helper, gradient = "from-blue-500 via-blue-400 to-blue-300" }: AnalyticsCardProps) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <div className="flex items-center gap-3">
        <div className={`h-1.5 w-10 rounded-full bg-gradient-to-r shadow-lg shadow-blue-500/30 ${gradient}`}></div>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles: Record<string, string> = {
    verified: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
    failed: "border-red-400/40 bg-red-500/10 text-red-100",
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  };
  const label = normalized.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[normalized] ?? "border-slate-700 text-slate-200"}`}>
      {label}
    </span>
  );
}
function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">Page {page} of {pageCount}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, pageCount))}
          disabled={page >= pageCount}
          className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ReceiptDetailModal({ state, onClose, onVerify }: ReceiptDetailModalProps) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm text-slate-200">
          Loading receipt details...
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
          <p className="font-semibold text-white">Unable to load receipt</p>
          <p>{state.message}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-red-400/60 px-3 py-1.5 text-xs font-semibold text-red-100"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const receipt = state.receipt;
  const verification = state.verification;
  const proofSummary = JSON.stringify(
    {
      merkleRoot: receipt.cryptographicProof.merkleRoot,
      algorithm: receipt.cryptographicProof.algorithm,
      issuedAt: receipt.cryptographicProof.issuedAt,
      signature: receipt.cryptographicProof.signature,
    },
    null,
    2,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur">
      <div className="relative w-full max-w-3xl space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-sm text-slate-200 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xs text-slate-500 hover:text-slate-200"
        >
          Close
        </button>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Receipt</p>
          <h2 className="text-xl font-semibold text-white">{receipt.transactionId}</h2>
          <p className="text-xs text-slate-500">{receipt.id}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Amount" value={formatCurrency(receipt.amount.amount)} />
          <DetailRow label="Status" value={<StatusBadge status={receipt.status} />} />
          <DetailRow
            label="Created"
            value={`${new Date(receipt.createdAt).toLocaleString()} (${formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })})`}
          />
          <DetailRow label="API key" value={receipt.apiKey.name} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Transaction metadata</p>
            <KeyValueList data={receipt.metadata} />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Proof evidence</p>
            <KeyValueList data={receipt.cryptographicProof.evidence} />
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cryptographic proof</p>
            <button
              type="button"
              onClick={() => onVerify(receipt.id)}
              className="rounded-md border border-blue-400/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-100"
            >
              Verify proof
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-slate-950/80 p-3 text-xs text-slate-300">
{proofSummary}
          </pre>
          {verification ? (
            <div
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                verification.ok
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-red-400/40 bg-red-500/10 text-red-100"
              }`}
            >
              <p>{verification.ok ? "Proof verified" : "Proof verification failed"}</p>
              {!verification.ok && verification.reasons.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] font-normal">
                  {verification.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm text-slate-100">{value}</div>
    </div>
  );
}

function KeyValueList({ data }: KeyValueListProps) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-500">No data</p>;
  }

  return (
    <div className="space-y-1 text-xs text-slate-300">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="flex items-start justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1"
        >
          <span className="font-semibold text-slate-200">{key}</span>
          <span className="max-w-[16rem] break-words text-right text-slate-400">
            {typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

