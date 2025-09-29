import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { detectionQueue } from "@/lib/queue";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get job from queue
    const job = await detectionQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Extract job status and result
    let status: string;
    let result: any = null;
    let error: string | null = null;

    // Handle different queue implementations
    if ('status' in job) {
      // In-memory queue format
      status = job.status;
      result = job.result;
      error = job.error;
    } else {
      // BullMQ job format
      if (job.finishedOn) {
        status = job.failedReason ? 'failed' : 'completed';
        result = job.returnvalue;
        error = job.failedReason;
      } else if (job.processedOn) {
        status = 'processing';
      } else {
        status = 'pending';
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        id: jobId,
        status,
        result,
        error,
        createdAt: 'createdAt' in job ? job.createdAt : new Date(job.timestamp || Date.now()),
        processedAt: 'processedAt' in job ? job.processedAt :
                     (job.processedOn ? new Date(job.processedOn) : null),
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        attempts: 'attempts' in job ? job.attempts : (job.attemptsMade || 0),
      }
    });

  } catch (error) {
    console.error("Job status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}