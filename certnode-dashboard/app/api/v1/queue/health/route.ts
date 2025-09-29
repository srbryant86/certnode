import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { detectionQueue } from "@/lib/queue";

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Get queue health and metrics
    const healthCheck = await detectionQueue.healthCheck();
    const metrics = await detectionQueue.getMetrics();

    return NextResponse.json({
      success: true,
      health: healthCheck,
      metrics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Queue health check error:", error);
    return NextResponse.json({
      success: false,
      health: {
        healthy: false,
        type: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}