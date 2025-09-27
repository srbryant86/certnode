'use client';

import Link from 'next/link';
import { type Route } from 'next';

const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_DASHBOARD === 'true';

export default function AnalyticsPage() {
  if (!analyticsEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span>Analytics Dashboard</span>
            <span className="text-blue-400">Coming Soon</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Analytics access is limited to enrolled customers.</h1>
          <p className="text-lg text-gray-600">
            We are finalizing authenticated reporting backed by real telemetry. Once ready, signed-in customers will be able to review revenue, conversion, and usage insights in this space.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href={'/support' as Route}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Visit Support
            </Link>
            <Link
              href={'/pricing' as Route}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-24 text-center">
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Analytics dashboard staging environment</h1>
        <p className="text-gray-600">
          Set <code className="rounded bg-gray-100 px-2 py-1 text-sm">NEXT_PUBLIC_ENABLE_ANALYTICS_DASHBOARD=true</code> and redeploy to expose the interactive reporting UI for internal testing.
        </p>
      </div>
    </div>
  );
}
