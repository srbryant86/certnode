import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ContentReceiptFilter {
  search?: string;
  contentTypes?: string[];
  statuses?: VerificationStatus[];
  from?: Date | null;
  to?: Date | null;
  minConfidence?: number | null;
  maxConfidence?: number | null;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "confidence";
  sortOrder?: "asc" | "desc";
}

export interface ContentReceiptListItem {
  id: string;
  contentHash: string;
  contentType: string;
  status: VerificationStatus;
  createdAt: Date;
  apiKeyName: string;
  contentAiScores: Record<string, unknown> | null;
  confidence?: number;
  detectedModels?: string[];
  indicators?: string[];
}

export interface ContentReceiptListResult {
  receipts: ContentReceiptListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  analytics: {
    successRate: number;
    failureRate: number;
    averageConfidence: number;
    contentTypeDistribution: Record<string, number>;
    aiDetectionRate: number;
  };
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function listContentReceipts(
  enterpriseId: string,
  filter: ContentReceiptFilter = {},
): Promise<ContentReceiptListResult> {
  const pageSize = Math.min(filter.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(filter.page ?? 1, 1);
  const offset = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    enterpriseId,
    type: 'CONTENT', // Filter for content receipts only
  };

  if (filter.search) {
    where.OR = [
      { contentHash: { contains: filter.search, mode: 'insensitive' } },
      { contentType: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  if (filter.contentTypes?.length) {
    where.contentType = { in: filter.contentTypes };
  }

  if (filter.statuses?.length) {
    where.status = { in: filter.statuses };
  }

  if (filter.from) {
    where.createdAt = { ...where.createdAt, gte: filter.from };
  }

  if (filter.to) {
    where.createdAt = { ...where.createdAt, lte: filter.to };
  }

  // Execute queries
  const [receipts, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      select: {
        id: true,
        contentHash: true,
        contentType: true,
        status: true,
        createdAt: true,
        contentAiScores: true,
        apiKey: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        [filter.sortBy ?? 'createdAt']: filter.sortOrder ?? 'desc',
      },
      skip: offset,
      take: pageSize,
    }),
    prisma.receipt.count({ where }),
  ]);

  // Transform receipts and extract AI detection data
  const transformedReceipts = receipts.map((receipt): ContentReceiptListItem => {
    const aiScores = receipt.contentAiScores as any;

    return {
      id: receipt.id,
      contentHash: receipt.contentHash || '',
      contentType: receipt.contentType || '',
      status: receipt.status,
      createdAt: receipt.createdAt,
      apiKeyName: receipt.apiKey?.name || 'Unknown',
      contentAiScores: receipt.contentAiScores,
      confidence: aiScores?.confidence || 0,
      detectedModels: aiScores?.modelSignatures || [],
      indicators: aiScores?.indicators || [],
    };
  });

  // Calculate analytics
  const analytics = await calculateContentAnalytics(enterpriseId, receipts);

  return {
    receipts: transformedReceipts,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    analytics,
  };
}

async function calculateContentAnalytics(
  enterpriseId: string,
  receipts: any[]
): Promise<ContentReceiptListResult['analytics']> {
  const allContentReceipts = await prisma.receipt.findMany({
    where: {
      enterpriseId,
      type: 'CONTENT',
    },
    select: {
      status: true,
      contentType: true,
      contentAiScores: true,
    },
  });

  const successCount = allContentReceipts.filter(r => r.status === 'VERIFIED').length;
  const failureCount = allContentReceipts.filter(r => r.status === 'FAILED').length;
  const total = allContentReceipts.length;

  // Calculate average confidence
  const confidenceScores = allContentReceipts
    .map(r => (r.contentAiScores as any)?.confidence)
    .filter(c => typeof c === 'number');

  const averageConfidence = confidenceScores.length > 0
    ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length
    : 0;

  // Content type distribution
  const contentTypeDistribution: Record<string, number> = {};
  allContentReceipts.forEach(receipt => {
    const type = receipt.contentType || 'unknown';
    contentTypeDistribution[type] = (contentTypeDistribution[type] || 0) + 1;
  });

  // AI detection rate (receipts with confidence > 0.5)
  const aiDetectedCount = allContentReceipts.filter(r =>
    (r.contentAiScores as any)?.confidence > 0.5
  ).length;

  return {
    successRate: total > 0 ? successCount / total : 0,
    failureRate: total > 0 ? failureCount / total : 0,
    averageConfidence,
    contentTypeDistribution,
    aiDetectionRate: total > 0 ? aiDetectedCount / total : 0,
  };
}

export async function getContentReceipt(id: string): Promise<ContentReceiptListItem | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      apiKey: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!receipt || receipt.type !== 'CONTENT') {
    return null;
  }

  const aiScores = receipt.contentAiScores as any;

  return {
    id: receipt.id,
    contentHash: receipt.contentHash || '',
    contentType: receipt.contentType || '',
    status: receipt.status,
    createdAt: receipt.createdAt,
    apiKeyName: receipt.apiKey?.name || 'Unknown',
    contentAiScores: receipt.contentAiScores,
    confidence: aiScores?.confidence || 0,
    detectedModels: aiScores?.modelSignatures || [],
    indicators: aiScores?.indicators || [],
  };
}