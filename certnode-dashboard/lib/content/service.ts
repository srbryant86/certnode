import { hashBase64, hashBuffer, normalizeContentHash, type HashResult } from "@/lib/content/hash";
import { buildMetadata } from "@/lib/content/metadata";
import { normalizeProvenance, type ProvenanceInput } from "@/lib/content/provenance";
import { signPayload } from "@/lib/signing";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { contentIntelligenceEngine, type ContentInput } from "./intelligence-engine/content-intelligence-engine";
import { reportGenerator } from "./intelligence-engine/report-generator";

export interface CreateContentReceiptInput {
  enterpriseId: string;
  createdByUserId?: string | null;
  contentBase64?: string;
  contentBuffer?: Buffer;
  contentHash?: string;
  contentType?: string | null;
  metadata?: Record<string, unknown> | null;
  provenance?: ProvenanceInput | null;
  detectorResults?: Record<string, unknown> | null;
}

export interface CreateContentReceiptResult {
  id: string;
  receiptId: string;
  contentHash: string;
  cryptographicProof: Record<string, unknown>;
  intelligenceAnalysis?: {
    confidence: number;
    riskLevel: string;
    recommendation: string;
    detectors: string[];
    analysisId: string;
  };
  comprehensiveReport?: any;
}

export class ContentReceiptService {
  async create(input: CreateContentReceiptInput): Promise<CreateContentReceiptResult> {
    const hash = this.resolveHash(input);
    const metadata = buildMetadata({
      contentType: input.contentType,
      sizeBytes: hash.sizeBytes,
      metadata: input.metadata ?? undefined,
    }, hash.sizeBytes);
    const provenance = normalizeProvenance(input.provenance);

    const payload = this.buildPayload({
      contentHash: hash.digest,
      metadata,
      provenance,
      detectorResults: input.detectorResults ?? null,
    });

    const signed = await signPayload(payload);

    // Run comprehensive content intelligence analysis
    let intelligenceAnalysis = undefined;
    let comprehensiveReport = undefined;

    if (input.contentBase64 || input.contentBuffer) {
      try {
        const contentInput: ContentInput = {
          content: input.contentBuffer || Buffer.from(input.contentBase64!, 'base64'),
          contentType: input.contentType || 'application/octet-stream',
          metadata: input.metadata || undefined,
          provenance: input.provenance || undefined
        };

        const analysis = await contentIntelligenceEngine.analyzeContent(contentInput);
        comprehensiveReport = reportGenerator.generateReport(analysis);

        // Extract key metrics for storage
        intelligenceAnalysis = {
          confidence: analysis.authenticity.confidence,
          riskLevel: analysis.authenticity.riskLevel,
          recommendation: analysis.authenticity.recommendation,
          detectors: Object.values(analysis.detectionResults)
            .filter(Boolean)
            .map(result => result!.detector),
          analysisId: analysis.authenticity.analysisId
        };

        console.log(`Content intelligence analysis completed: ${analysis.authenticity.analysisId} - ${analysis.authenticity.confidence}% confidence`);
      } catch (error) {
        console.error('Content intelligence analysis failed:', error);
        // Continue with receipt creation even if analysis fails
      }
    }

    const record = await prisma.receipt.create({
      data: {
        enterpriseId: input.enterpriseId,
        transactionId: `content_${nanoid(16)}`,
        transactionData: payload,
        cryptographicProof: signed,
        verificationStatus: "VERIFIED",
        type: "CONTENT",
        contentHash: hash.digest,
        contentType: metadata.contentType ?? null,
        contentMetadata: metadata.additional ?? null,
        contentProvenance: provenance,
        contentAiScores: input.detectorResults ?? null,
        currency: "N/A",
      },
    });

    return {
      id: record.id,
      receiptId: signed.receipt_id,
      contentHash: hash.digest,
      cryptographicProof: signed as unknown as Record<string, unknown>,
      intelligenceAnalysis,
      comprehensiveReport,
    };
  }

  private resolveHash(input: CreateContentReceiptInput): HashResult {
    if (input.contentBuffer) {
      return hashBuffer(input.contentBuffer);
    }
    if (input.contentBase64) {
      return hashBase64(input.contentBase64);
    }
    const normalized = normalizeContentHash(input.contentHash);
    if (!normalized) {
      throw new Error("A content hash or content payload is required");
    }
    return {
      algorithm: "sha256",
      digest: normalized,
      sizeBytes: input.metadata?.sizeBytes ?? 0,
    };
  }

  private buildPayload(params: {
    contentHash: string;
    metadata: ReturnType<typeof buildMetadata>;
    provenance: ReturnType<typeof normalizeProvenance>;
    detectorResults: Record<string, unknown> | null;
  }): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      type: "content",
      content_hash: params.contentHash,
      issued_at: new Date().toISOString(),
    };

    if (params.metadata.contentType) payload.content_type = params.metadata.contentType;
    if (typeof params.metadata.sizeBytes === "number") payload.content_size = params.metadata.sizeBytes;
    if (params.metadata.additional) payload.metadata = params.metadata.additional;
    if (params.provenance) payload.provenance = params.provenance;
    if (params.detectorResults) payload.detector_results = params.detectorResults;

    return payload;
  }
}

export const contentReceiptService = new ContentReceiptService();
