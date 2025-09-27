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
import { formatNumber, formatPercentage } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";

type SortByOption = "createdAt" | "confidence";
type SortOrderOption = "asc" | "desc";

type SerializableContentReceipt = {
  id: string;
  contentHash: string;
  contentType: string;
  status: string;
  createdAt: string;
  apiKeyName: string;
  contentAiScores: Record<string, unknown> | null;
  confidence?: number;
  detectedModels?: string[];
  indicators?: string[];
};

type SerializableContentAnalytics = {
  successRate: number;
  failureRate: number;
  averageConfidence: number;
  contentTypeDistribution: Record<string, number>;
  aiDetectionRate: number;
};

type SerializableContentResult = {
  receipts: SerializableContentReceipt[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  analytics: SerializableContentAnalytics;
};

type ContentClientFilter = {
  search: string;
  contentTypes: string[];
  statuses: string[];
  from: string;
  to: string;
  minConfidence: string;
  maxConfidence: string;
  sortBy: SortByOption;
  sortOrder: SortOrderOption;
  page: number;
  pageSize: number;
};

type ContentReceiptsClientProps = {
  initialData: SerializableContentResult;
  initialFilter: Partial<ContentClientFilter> & { statuses: string[]; contentTypes: string[] };
};

export function ContentReceiptsClient({
  initialData,
  initialFilter,
}: ContentReceiptsClientProps) {
  const [filter, setFilter] = useState<ContentClientFilter>({
    search: initialFilter.search ?? "",
    contentTypes: initialFilter.contentTypes ?? [],
    statuses: initialFilter.statuses ?? [],
    from: initialFilter.from ?? "",
    to: initialFilter.to ?? "",
    minConfidence: initialFilter.minConfidence ?? "",
    maxConfidence: initialFilter.maxConfidence ?? "",
    sortBy: initialFilter.sortBy ?? "createdAt",
    sortOrder: initialFilter.sortOrder ?? "desc",
    page: initialFilter.page ?? 1,
    pageSize: initialFilter.pageSize ?? 25,
  });

  const [data, setData] = useState<SerializableContentResult>(initialData);
  const [isPending, startTransition] = useTransition();
  const [selectedReceipt, setSelectedReceipt] = useState<SerializableContentReceipt | null>(null);

  const analytics = data.analytics;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "text-green-400";
      case "FAILED":
        return "text-red-400";
      case "PENDING":
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-red-400";
    if (confidence >= 0.5) return "text-yellow-400";
    return "text-green-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High AI Likelihood";
    if (confidence >= 0.5) return "Moderate AI Likelihood";
    return "Low AI Likelihood";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Content Authenticity</h1>
        <div className="text-sm text-slate-400">
          {data.total} content {data.total === 1 ? "receipt" : "receipts"}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Success Rate</div>
          <div className="text-2xl font-semibold text-white">
            {formatPercentage(analytics.successRate)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Failure Rate</div>
          <div className="text-2xl font-semibold text-white">
            {formatPercentage(analytics.failureRate)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Avg Confidence</div>
          <div className="text-2xl font-semibold text-white">
            {formatPercentage(analytics.averageConfidence)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">AI Detection Rate</div>
          <div className="text-2xl font-semibold text-white">
            {formatPercentage(analytics.aiDetectionRate)}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400">Content Types</div>
          <div className="text-2xl font-semibold text-white">
            {Object.keys(analytics.contentTypeDistribution).length}
          </div>
        </div>
      </div>

      {/* Content Receipts Table */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Content Hash
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  AI Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.receipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="hover:bg-slate-700/25 cursor-pointer transition-colors"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <div className="font-mono text-xs">
                      {receipt.contentHash.slice(0, 16)}...
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                      {receipt.contentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className={`font-medium ${getConfidenceColor(receipt.confidence || 0)}`}>
                      {formatPercentage(receipt.confidence || 0)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getConfidenceLabel(receipt.confidence || 0)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${getStatusColor(receipt.status)}`}>
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {receipt.apiKeyName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {formatDistanceToNow(new Date(receipt.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.receipts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 text-sm">No content receipts found</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {((data.page - 1) * data.pageSize) + 1} to{" "}
            {Math.min(data.page * data.pageSize, data.total)} of {data.total} results
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(data.pageCount, 10) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-3 py-1 text-sm rounded ${
                  page === data.page
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Content Receipt Details</h2>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Content Hash</label>
                    <div className="font-mono text-sm text-slate-400 bg-slate-900 p-2 rounded mt-1">
                      {selectedReceipt.contentHash}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Content Type</label>
                    <div className="text-sm text-slate-400 mt-1">{selectedReceipt.contentType}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">AI Confidence</label>
                    <div className={`text-lg font-semibold mt-1 ${getConfidenceColor(selectedReceipt.confidence || 0)}`}>
                      {formatPercentage(selectedReceipt.confidence || 0)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Status</label>
                    <div className={`text-lg font-semibold mt-1 ${getStatusColor(selectedReceipt.status)}`}>
                      {selectedReceipt.status}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Created</label>
                    <div className="text-sm text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(selectedReceipt.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {selectedReceipt.detectedModels && selectedReceipt.detectedModels.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Detected AI Models</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedReceipt.detectedModels.map((model, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-300 border border-red-700/50"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReceipt.indicators && selectedReceipt.indicators.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">Detection Indicators</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedReceipt.indicators.map((indicator, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700/50"
                        >
                          {indicator.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReceipt.contentAiScores && (
                  <div>
                    <label className="text-sm font-medium text-slate-300">AI Analysis Results</label>
                    <div className="bg-slate-900 rounded p-4 mt-2">
                      <pre className="text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(selectedReceipt.contentAiScores, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}