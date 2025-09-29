import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { validationMonitor } from "@/lib/validation/monitoring/validation-monitor";
import { createSuccessResponse, createErrorResponse, QualityProfiles } from "@/lib/api-response-helpers";

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          code: 'AUTHENTICATION_FAILED',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Get health status
    const healthStatus = await validationMonitor.getHealthStatus();

    return NextResponse.json(
      createSuccessResponse(
        { health: healthStatus },
        QualityProfiles.validation
      )
    );

  } catch (error) {
    console.error("Validation health check error:", error);
    return NextResponse.json(
      createErrorResponse(
        "Failed to get validation health status",
        'HEALTH_CHECK_ERROR',
        QualityProfiles.validation
      ),
      { status: 500 }
    );
  }
}