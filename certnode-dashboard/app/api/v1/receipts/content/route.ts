import { NextRequest, NextResponse } from "next/server";
import { contentReceiptService } from "@/lib/content/service";
import { applyRateLimit, createRateLimitHeaders } from "@/lib/rate-limiting";
import { authenticateApiKey, hasPermission } from "@/lib/api-auth";
import { detectionQueue } from "@/lib/queue";
import { validateRequest, ValidationLayer } from "@/lib/validation/validation-middleware";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Parse request body first for validation
    const body = await request.json();
    const { searchParams } = new URL(request.url);

    // Step 1: Comprehensive 10/10 validation system
    const validationResult = await validateRequest(
      request,
      body,
      '/api/v1/receipts/content',
      {
        layers: [
          ValidationLayer.SCHEMA,
          ValidationLayer.SANITIZATION,
          ValidationLayer.BUSINESS,
          ValidationLayer.CRYPTOGRAPHIC,
          ValidationLayer.INTEGRITY,
          ValidationLayer.AUTHORIZATION,
          ValidationLayer.RATE_LIMIT,
          ValidationLayer.CONTENT,
          ValidationLayer.TEMPORAL,
          ValidationLayer.COMPLIANCE
        ],
        failFast: true,
        logResults: true,
        returnValidationDetails: process.env.NODE_ENV === 'development'
      }
    );

    if (!validationResult.success) {
      console.error('Content certification validation failed:', {
        requestId,
        errors: validationResult.errors,
        endpoint: '/api/v1/receipts/content',
        timestamp: new Date().toISOString()
      });

      return validationResult.response!;
    }

    // Step 2: Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          code: 'AUTHENTICATION_FAILED',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Step 3: Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, authResult.apiKeyId);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
          requestId,
          timestamp: new Date().toISOString()
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      );
    }

    // Note: Basic validation is now handled by the comprehensive validation system above

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
      validation: {
        passed: true,
        layers: 10,
        validationId: requestId
      },
      backgroundJob: backgroundJobId ? {
        id: backgroundJobId,
        status: 'queued',
        message: 'AI detection running in background. Check job status for updates.'
      } : undefined,
      requestId,
      timestamp: new Date().toISOString()
    }, {
      status: 201,
      headers: createRateLimitHeaders(rateLimitResult)
    });

  } catch (error) {
    console.error("Content certification system error:", {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/v1/receipts/content',
      timestamp: new Date().toISOString()
    });

    // Enhanced error response with validation context
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      code: 'SYSTEM_ERROR',
      layer: 'system',
      severity: 'critical',
      requestId,
      timestamp: new Date().toISOString()
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      errorResponse.stack = error.stack;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Enhanced AI detection using multi-modal algorithms (95%+ accuracy target)
async function runAdvancedAIDetection(contentBase64?: string, contentType?: string): Promise<Record<string, unknown>> {
  if (!contentBase64) {
    return {
      confidence: 0,
      reasoning: "No content provided for analysis",
      method: "multi_modal_detection",
      timestamp: new Date().toISOString(),
    };
  }

  // Use the new multi-modal detector for comprehensive analysis
  const { MultiModalDetector } = await import('@/lib/content/detectors/multi-modal-detector');
  const detector = new MultiModalDetector();

  // Determine content type and prepare input
  let modalType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text';
  let content: string | Buffer = Buffer.from(contentBase64, 'base64');

  if (contentType?.startsWith('text/') || contentType?.includes('json')) {
    modalType = 'text';
    content = content.toString('utf-8');
  } else if (contentType?.startsWith('image/')) {
    modalType = 'image';
  } else if (contentType?.startsWith('video/')) {
    modalType = 'video';
  } else if (contentType?.startsWith('audio/')) {
    modalType = 'audio';
  } else if (contentType?.includes('pdf') || contentType?.includes('document') ||
             contentType?.includes('msword') || contentType?.includes('excel') ||
             contentType?.includes('powerpoint') || contentType?.includes('openxml')) {
    modalType = 'document';
  }

  // Run multi-modal analysis
  const result = await detector.analyzeContent({
    contentType: modalType,
    content,
    metadata: {
      originalFormat: contentType,
      fileSize: Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf-8')
    }
  });

  return {
    confidence: result.overallConfidence,
    modality: result.modality,
    crossModalConsistency: result.crossModalConsistency,
    modalityResults: result.modalityResults,
    aggregatedIndicators: result.aggregatedIndicators,
    reasoning: result.reasoning,
    metadata: result.metadata,
    processingTime: result.processingTime,
    method: "multi_modal_detection",
    timestamp: new Date().toISOString(),
  };
}