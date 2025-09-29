import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { validationMonitor } from "@/lib/validation/monitoring/validation-monitor";

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

    return NextResponse.json({
      success: true,
      health: healthStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Validation health check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get validation health status",
        code: 'HEALTH_CHECK_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}