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

    // Get active validation alerts
    const alerts = await validationMonitor.getActiveAlerts();

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Validation alerts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get validation alerts",
        code: 'ALERTS_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { alertId, action, acknowledgedBy } = body;

    // Validate request
    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: "Alert ID is required",
          code: 'MISSING_ALERT_ID',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (action !== 'acknowledge') {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Only 'acknowledge' is supported",
          code: 'INVALID_ACTION',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (!acknowledgedBy) {
      return NextResponse.json(
        {
          success: false,
          error: "acknowledgedBy is required",
          code: 'MISSING_ACKNOWLEDGED_BY',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Acknowledge the alert
    const success = await validationMonitor.acknowledgeAlert(alertId, acknowledgedBy);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to acknowledge alert",
          code: 'ACKNOWLEDGE_FAILED',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alert acknowledged successfully",
      alertId,
      acknowledgedBy,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Validation alert acknowledgment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process alert acknowledgment",
        code: 'ACKNOWLEDGE_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}