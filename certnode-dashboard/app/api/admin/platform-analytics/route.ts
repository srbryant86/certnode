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

    const platformData = await enterpriseAnalytics.getPlatformAnalytics();

    return NextResponse.json({
      success: true,
      data: platformData
    });

  } catch (error) {
    console.error('Platform analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch platform analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}