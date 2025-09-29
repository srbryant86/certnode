import { NextRequest, NextResponse } from "next/server";
import { contentReceiptService } from "@/lib/content/service";
import { applyRateLimit, createRateLimitHeaders } from "@/lib/rate-limiting";
import { authenticateApiKey, hasPermission } from "@/lib/api-auth";
import { detectionQueue } from "@/lib/queue";

export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, authResult.apiKeyId);

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
    const { searchParams } = new URL(request.url);

    // Basic validation
    if (!body.contentBase64 && !body.contentHash) {
      return NextResponse.json(
        { error: "Either contentBase64 or contentHash must be provided" },
        { status: 400 }
      );
    }

    const { contentBase64, contentHash, contentType, metadata, provenance, detectorResults } = body;

    // Use authenticated enterprise ID
    const enterpriseId = authResult.enterpriseId!;

    // Check if background processing is requested
    const useBackground = searchParams.get('background') === 'true';
    const contentSize = contentBase64 ? Buffer.from(contentBase64, 'base64').length : 0;
    const shouldUseBackground = useBackground || contentSize > 5 * 1024 * 1024; // 5MB threshold

    // Run advanced AI detection if detectorResults not provided
    let aiDetectionResults = detectorResults;
    let backgroundJobId: string | null = null;

    if (!aiDetectionResults && (contentBase64 || contentType?.startsWith('text/'))) {
      if (shouldUseBackground) {
        // Queue for background processing
        backgroundJobId = await detectionQueue.addJob({
          receiptId: '', // Will be updated after receipt creation
          contentType: contentType || 'application/octet-stream',
          contentHash: contentHash || '',
          contentBase64,
          priority: contentSize > 50 * 1024 * 1024 ? 'high' : 'normal', // 50MB threshold for high priority
        });

        // Set placeholder result
        aiDetectionResults = {
          confidence: 0,
          reasoning: "AI detection queued for background processing",
          method: "background_queued",
          backgroundJobId,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Run synchronously for smaller files
        aiDetectionResults = await runAdvancedAIDetection(contentBase64, contentType);
      }
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

    // Update background job with receipt ID if needed
    if (backgroundJobId && result.receiptId) {
      try {
        // Note: In a full implementation, you'd need to update the job data
        // For now, we'll just log it since BullMQ jobs are immutable once created
        console.log(`Receipt ${result.receiptId} created for background job ${backgroundJobId}`);
      } catch (error) {
        console.warn('Failed to update background job with receipt ID:', error);
      }
    }

    return NextResponse.json({
      success: true,
      receipt: result,
      backgroundJob: backgroundJobId ? {
        id: backgroundJobId,
        status: 'queued',
        message: 'AI detection running in background. Check job status for updates.'
      } : undefined,
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