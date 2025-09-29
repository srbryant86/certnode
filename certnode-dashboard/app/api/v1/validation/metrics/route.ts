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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' || 'day';

    // Validate timeframe
    if (!['hour', 'day', 'week'].includes(timeframe)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid timeframe. Must be 'hour', 'day', or 'week'",
          code: 'INVALID_TIMEFRAME',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Get validation metrics
    const metrics = await validationMonitor.getMetrics(timeframe);

    return NextResponse.json({
      success: true,
      metrics,
      timeframe,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Validation metrics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get validation metrics",
        code: 'METRICS_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}