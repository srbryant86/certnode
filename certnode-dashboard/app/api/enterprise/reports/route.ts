import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAnalytics } from '@/lib/enterprise-analytics';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { enterpriseId, startDate, endDate } = body;

    if (!enterpriseId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Enterprise ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    const report = await enterpriseAnalytics.generateReport(
      enterpriseId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}