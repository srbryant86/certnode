import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAnalytics } from '@/lib/enterprise-analytics';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const enterpriseId = searchParams.get('enterpriseId');

    if (!enterpriseId) {
      return NextResponse.json(
        { error: 'Enterprise ID required' },
        { status: 400 }
      );
    }

    const usage = await enterpriseAnalytics.getCurrentUsage(enterpriseId);

    return NextResponse.json({
      success: true,
      data: usage
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}