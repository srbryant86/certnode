import { NextRequest, NextResponse } from "next/server";
import { contentReceiptService } from "@/lib/content/service";
import { applyRateLimit, createRateLimitHeaders } from "@/lib/rate-limiting";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const apiKey = request.headers.get('x-api-key');
    const rateLimitResult = await applyRateLimit(request, apiKey || undefined);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // Parse request body
    const body = await request.json();

    // Basic validation
    if (!body.contentBase64 && !body.contentHash) {
      return NextResponse.json(
        { error: "Either contentBase64 or contentHash must be provided" },
        { status: 400 }
      );
    }

    const { contentBase64, contentHash, contentType, metadata, provenance, detectorResults } = body;

    // For development, use a default enterprise ID
    // In production, this would come from API key authentication
    const enterpriseId = "dev-enterprise-1";

    // Run advanced AI detection if detectorResults not provided
    let aiDetectionResults = detectorResults;
    if (!aiDetectionResults && (contentBase64 || contentType?.startsWith('text/'))) {
      // Run advanced AI detection
      aiDetectionResults = await runAdvancedAIDetection(contentBase64, contentType);
    }

    // Create content receipt
    const result = await contentReceiptService.create({
      enterpriseId,
      contentBase64,
      contentHash,
      contentType,
      metadata,
      provenance,
      detectorResults: aiDetectionResults,
    });

    return NextResponse.json({
      success: true,
      receipt: result,
    }, {
      status: 201,
      headers: createRateLimitHeaders(rateLimitResult)
    });

  } catch (error) {
    console.error("Content certification error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Enhanced AI detection using advanced algorithms (90%+ accuracy target)
async function runAdvancedAIDetection(contentBase64?: string, contentType?: string): Promise<Record<string, unknown>> {
  if (!contentBase64) {
    return {
      confidence: 0,
      reasoning: "No content provided for analysis",
      method: "advanced_detection",
      timestamp: new Date().toISOString(),
    };
  }

  // Decode content for analysis
  const content = Buffer.from(contentBase64, 'base64').toString('utf-8');

  if (contentType?.startsWith('text/') || contentType?.includes('json')) {
    // Use advanced text detection
    const { advancedTextDetector } = await import('@/lib/content/detectors/advanced-text');
    const result = await advancedTextDetector.analyze(content);

    return {
      confidence: result.confidence,
      methods: result.methods,
      indicators: result.indicators,
      reasoning: result.reasoning,
      modelSignatures: result.modelSignatures,
      confidenceInterval: result.confidenceInterval,
      processingTime: result.processingTime,
      method: "advanced_text_detection",
      timestamp: new Date().toISOString(),
    };
  } else if (contentType?.startsWith('image/')) {
    // Use image metadata detection
    const { imageMetadataDetector } = await import('@/lib/content/detectors/image-metadata');
    const imageBuffer = Buffer.from(contentBase64, 'base64');
    const result = await imageMetadataDetector.analyze(imageBuffer);

    return {
      confidence: result.confidence,
      metadata: result.metadata,
      statistics: result.statistics,
      indicators: result.indicators,
      reasoning: result.reasoning,
      processingTime: result.processingTime,
      method: "advanced_image_detection",
      timestamp: new Date().toISOString(),
    };
  }

  // For non-text content, return basic metadata analysis
  return {
    confidence: 0.1,
    reasoning: "Content type not supported for AI detection",
    method: "advanced_detection",
    contentLength: content.length,
    timestamp: new Date().toISOString(),
  };
}