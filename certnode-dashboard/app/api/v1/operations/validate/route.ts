import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { enhancedOperationsService } from "@/lib/operations/enhanced-operations-service";
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
      '/api/v1/operations/validate',
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
    const {
      enterpriseId,
      operationType,
      severity,
      timestamp,
      incidentData,
      buildData,
      policyData,
      metadata,
      createReceipt,
      notifyStakeholders,
      auditLevel
    } = body;

    if (!enterpriseId || !operationType || !severity) {
      return NextResponse.json(
        createErrorResponse(
          "Missing required fields: enterpriseId, operationType, severity",
          'MISSING_REQUIRED_FIELDS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      );
    }

    // Validate operation type
    const validOperationTypes = ['incident', 'build_provenance', 'policy_change', 'sla_breach', 'compliance_report', 'audit_event'];
    if (!validOperationTypes.includes(operationType)) {
      return NextResponse.json(
        createErrorResponse(
          `Invalid operation type. Must be one of: ${validOperationTypes.join(', ')}`,
          'INVALID_OPERATION_TYPE',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      );
    }

    // Validate severity level
    const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
    if (!validSeverityLevels.includes(severity)) {
      return NextResponse.json(
        createErrorResponse(
          `Invalid severity level. Must be one of: ${validSeverityLevels.join(', ')}`,
          'INVALID_SEVERITY_LEVEL',
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
      endpoint: '/api/v1/operations/validate',
      method: 'POST' as const
    };

    // Run comprehensive operational intelligence analysis
    const enhancedResult = await enhancedOperationsService.processOperation(
      {
        enterpriseId,
        operationType,
        severity,
        timestamp: timestamp || new Date().toISOString(),
        incidentData,
        buildData,
        policyData,
        metadata,
        createReceipt: createReceipt !== false, // Default to true
        notifyStakeholders: notifyStakeholders || false,
        auditLevel: auditLevel || 'standard'
      },
      validationContext
    );

    // Determine response status based on analysis
    let statusCode = 200;
    let responseMessage = 'Operational validation completed';

    if (!enhancedResult.validation.allowed) {
      if (enhancedResult.validation.status === 'escalation_required') {
        statusCode = 202; // Accepted but requires escalation
        responseMessage = 'Operation requires management approval';
      } else {
        statusCode = 422; // Unprocessable Entity
        responseMessage = 'Operational validation failed';
      }
    } else if (enhancedResult.validation.status === 'requires_review') {
      statusCode = 202; // Accepted but requires review
      responseMessage = 'Operation approved with conditions';
    }

    // Create comprehensive response
    const responseData = {
      operationalValidation: {
        allowed: enhancedResult.validation.allowed,
        status: enhancedResult.validation.status,
        reason: enhancedResult.validation.reason
      },
      intelligenceAnalysis: enhancedResult.intelligenceAnalysis,
      riskAssessment: {
        riskLevel: enhancedResult.intelligenceAnalysis?.riskLevel || 'unknown',
        operationalRisk: enhancedResult.intelligenceAnalysis?.operationalRisk || 0,
        complianceScore: enhancedResult.intelligenceAnalysis?.complianceScore || 0,
        businessImpact: enhancedResult.intelligenceAnalysis?.businessImpact || 'Impact assessment unavailable',
        requiresEscalation: enhancedResult.intelligenceAnalysis?.requiresEscalation || false
      },
      validation: {
        passed: enhancedResult.validation.allowed,
        layers: '10/10 operational intelligence layers',
        analysisId: enhancedResult.intelligenceAnalysis?.analysisId || requestId,
        processingEngine: 'Enterprise Operations Trust Intelligence'
      },
      compliance: {
        complianceScore: enhancedResult.intelligenceAnalysis?.complianceScore || 0,
        auditTrail: enhancedResult.intelligenceAnalysis?.auditTrail || [],
        complianceReport: enhancedResult.comprehensiveReport ? 'Available' : 'Not generated'
      },
      reports: {
        comprehensiveReport: enhancedResult.comprehensiveReport ? 'Generated' : 'Not available',
        incidentReport: enhancedResult.incidentReport ? 'Generated' : 'Not applicable',
        buildProvenanceReport: enhancedResult.buildProvenanceReport ? 'Generated' : 'Not applicable',
        policyChangeReport: enhancedResult.policyChangeReport ? 'Generated' : 'Not applicable',
        auditReport: enhancedResult.auditReport ? 'Generated' : 'Not available'
      },
      attestation: {
        receiptCreated: !!enhancedResult.receipt,
        receiptId: enhancedResult.receipt?.receiptId,
        attestationHash: enhancedResult.receipt?.attestationHash,
        chainOfCustody: enhancedResult.receipt?.chainOfCustody || []
      },
      stakeholderNotifications: enhancedResult.stakeholderNotifications || {
        sent: false,
        recipients: [],
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(
      createSuccessResponse(responseData, {
        platform: 'Operations trust intelligence infrastructure',
        security: '10-layer operational validation',
        validation: 'Incident management + compliance automation',
        processing: 'Real-time risk assessment + stakeholder management'
      }),
      { status: statusCode }
    );

  } catch (error) {
    console.error("Operational validation error:", error);
    return NextResponse.json(
      createErrorResponse(
        "Operational validation system error",
        'OPERATIONAL_VALIDATION_ERROR',
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

    // Return operations intelligence system information
    const systemInfo = {
      service: 'Operations Trust Intelligence Engine',
      version: '1.0.0',
      capabilities: [
        'Incident management and attestation',
        'Build provenance validation',
        'Policy change compliance',
        'Operational risk assessment',
        'Regulatory compliance automation',
        'Professional audit documentation',
        'Stakeholder notification management',
        'Forensic evidence compilation'
      ],
      validationLayers: [
        'Process Validation',
        'Compliance Validation',
        'Security Validation',
        'Business Impact Assessment',
        'Audit Validation',
        'Governance Validation',
        'Risk Assessment',
        'Stakeholder Validation',
        'Documentation Validation',
        'Continuity Planning'
      ],
      operationTypes: [
        'incident',
        'build_provenance',
        'policy_change',
        'sla_breach',
        'compliance_report',
        'audit_event'
      ],
      severityLevels: [
        'low',
        'medium',
        'high',
        'critical'
      ],
      complianceFrameworks: [
        'SOX (Sarbanes-Oxley)',
        'ISO 27001 (Information Security)',
        'NIST (Cybersecurity Framework)',
        'COBIT (IT Governance)',
        'ITIL (IT Service Management)',
        'PCI-DSS (Payment Security)',
        'HIPAA (Healthcare Privacy)',
        'GDPR (Data Protection)'
      ],
      usage: {
        endpoint: '/api/v1/operations/validate',
        method: 'POST',
        authentication: 'API Key required',
        rateLimit: 'Per enterprise limits apply'
      },
      examples: {
        incident: {
          operationType: 'incident',
          severity: 'high',
          incidentData: {
            title: 'Service outage in production',
            description: 'Database connectivity issues affecting user login',
            affectedSystems: ['auth-service', 'user-database'],
            impactLevel: 'partial_outage'
          }
        },
        buildProvenance: {
          operationType: 'build_provenance',
          severity: 'medium',
          buildData: {
            repositoryUrl: 'https://github.com/company/app',
            commitSha: 'abc123def456',
            branch: 'main',
            buildId: 'build-789',
            buildEnvironment: 'production'
          }
        },
        policyChange: {
          operationType: 'policy_change',
          severity: 'medium',
          policyData: {
            policyId: 'SEC-001',
            policyType: 'security',
            changeType: 'modification',
            approvedBy: ['security-manager@company.com'],
            effectiveDate: '2024-01-01T00:00:00Z'
          }
        }
      }
    };

    return NextResponse.json(
      createSuccessResponse(systemInfo, {
        platform: 'Operations trust intelligence infrastructure',
        security: '10-layer operational validation system',
        validation: 'Enterprise-grade compliance automation',
        processing: 'Real-time operational risk assessment'
      })
    );

  } catch (error) {
    console.error("Operations info error:", error);
    return NextResponse.json(
      createErrorResponse(
        "Failed to get operations intelligence information",
        'OPERATIONS_INFO_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    );
  }
}