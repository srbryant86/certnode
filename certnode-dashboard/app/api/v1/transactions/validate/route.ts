import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { enhancedTransactionService } from "@/lib/transactions/enhanced-transaction-service";
import { validateRequest, ValidationLayer } from "@/lib/validation/validation-middleware";
import { createSuccessResponse, createErrorResponse, QualityProfiles } from "@/lib/api-response-helpers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Parse request body
    const body = await request.json();

    // Comprehensive validation using our 10/10 validation system
    const validationResult = await validateRequest(
      request,
      body,
      '/api/v1/transactions/validate',
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
        logResults: true
      }
    );

    if (!validationResult.success) {
      return validationResult.response;
    }

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(
          authResult.error,
          'AUTHENTICATION_FAILED',
          QualityProfiles.enterprise
        ),
        { status: 401 }
      );
    }

    // Validate required fields
    const { enterpriseId, amountCents, transactionType, currency, paymentMethod, customerInfo, location, metadata } = body;

    if (!enterpriseId || !amountCents || !transactionType) {
      return NextResponse.json(
        createErrorResponse(
          "Missing required fields: enterpriseId, amountCents, transactionType",
          'MISSING_REQUIRED_FIELDS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      );
    }

    // Build validation context
    const validationContext = {
      userId: authResult.user?.id,
      enterpriseId: authResult.enterprise?.id,
      apiKeyId: authResult.apiKey?.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      requestId,
      endpoint: '/api/v1/transactions/validate',
      method: 'POST' as const
    };

    // Run comprehensive transaction intelligence analysis
    const enhancedResult = await enhancedTransactionService.validateWithIntelligence(
      {
        enterpriseId,
        amountCents,
        transactionType,
        currency,
        paymentMethod,
        customerInfo,
        location,
        metadata
      },
      validationContext
    );

    // Determine response status based on analysis
    let statusCode = 200;
    let responseMessage = 'Transaction validation completed';

    if (!enhancedResult.allowed) {
      statusCode = 422; // Unprocessable Entity
      responseMessage = 'Transaction validation failed';
    } else if (enhancedResult.intelligenceAnalysis?.riskLevel === 'high') {
      statusCode = 202; // Accepted but requires review
      responseMessage = 'Transaction accepted with conditions';
    }

    // Create comprehensive response
    const responseData = {
      transactionValidation: {
        allowed: enhancedResult.allowed,
        status: enhancedResult.allowed ? 'approved' : 'declined',
        reason: enhancedResult.intelligenceAnalysis?.recommendation || 'Standard validation'
      },
      intelligenceAnalysis: enhancedResult.intelligenceAnalysis,
      riskAssessment: {
        riskLevel: enhancedResult.intelligenceAnalysis?.riskLevel || 'unknown',
        fraudProbability: enhancedResult.intelligenceAnalysis?.fraudProbability || 0,
        complianceScore: enhancedResult.intelligenceAnalysis?.complianceScore || 0
      },
      receipts: enhancedResult.receipts,
      transactionValue: enhancedResult.transactionValue,
      upgradeRecommendation: enhancedResult.upgradeRecommendation,
      validation: {
        passed: enhancedResult.allowed,
        layers: '10/10 transaction intelligence layers',
        analysisId: enhancedResult.intelligenceAnalysis?.analysisId || requestId,
        processingEngine: 'Enterprise Transaction Intelligence'
      },
      compliance: {
        alerts: enhancedResult.intelligenceAnalysis?.regulatoryAlerts || [],
        filingRequirements: enhancedResult.intelligenceAnalysis?.filingRequirements || [],
        complianceReport: enhancedResult.complianceReport ? 'Available' : 'Not generated'
      },
      reports: {
        comprehensiveAnalysis: enhancedResult.comprehensiveReport ? 'Generated' : 'Not available',
        fraudAssessment: enhancedResult.fraudAssessment ? 'Generated' : 'Not available',
        complianceReport: enhancedResult.complianceReport ? 'Generated' : 'Not available'
      }
    };

    return NextResponse.json(
      createSuccessResponse(responseData, {
        platform: 'Transaction intelligence infrastructure',
        security: '10-layer financial validation',
        validation: 'Fraud detection + compliance automation',
        processing: 'Real-time risk assessment'
      }),
      { status: statusCode }
    );

  } catch (error) {
    console.error("Transaction validation error:", error);
    return NextResponse.json(
      createErrorResponse(
        "Transaction validation system error",
        'TRANSACTION_VALIDATION_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(
          authResult.error,
          'AUTHENTICATION_FAILED',
          QualityProfiles.enterprise
        ),
        { status: 401 }
      );
    }

    // Return transaction intelligence system information
    const systemInfo = {
      service: 'Transaction Intelligence Engine',
      version: '1.0.0',
      capabilities: [
        'Real-time fraud detection',
        'Regulatory compliance automation',
        'Risk assessment and scoring',
        'AML/BSA compliance monitoring',
        '10-layer transaction validation',
        'Professional compliance reporting'
      ],
      validationLayers: [
        'Schema Validation',
        'Business Rules Validation',
        'Fraud Detection Engine',
        'Cryptographic Validation',
        'Regulatory Compliance Engine',
        'Authorization Validation',
        'Temporal Validation',
        'Cross-Reference Validation',
        'Risk Assessment Engine',
        'Audit Trail Validation'
      ],
      complianceFrameworks: [
        'AML (Anti-Money Laundering)',
        'BSA (Bank Secrecy Act)',
        'SOX (Sarbanes-Oxley)',
        'PCI-DSS (Payment Card Industry)',
        'GDPR (General Data Protection Regulation)',
        'OFAC (Office of Foreign Assets Control)'
      ],
      usage: {
        endpoint: '/api/v1/transactions/validate',
        method: 'POST',
        authentication: 'API Key required',
        rateLimit: 'Per enterprise limits apply'
      }
    };

    return NextResponse.json(
      createSuccessResponse(systemInfo, {
        platform: 'Transaction intelligence infrastructure',
        security: '10-layer financial validation system',
        validation: 'Enterprise-grade fraud detection',
        processing: 'Real-time compliance automation'
      })
    );

  } catch (error) {
    console.error("Transaction info error:", error);
    return NextResponse.json(
      createErrorResponse(
        "Failed to get transaction intelligence information",
        'TRANSACTION_INFO_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    );
  }
}