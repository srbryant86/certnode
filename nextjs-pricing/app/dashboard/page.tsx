import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in' as any)
  }

  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Hello, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              🎉 Authentication is working!
            </h2>
            <p className="text-gray-700 mb-4">
              You&apos;re now signed in and can access protected routes.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {userId}</p>
              <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}</p>
              <p><strong>Role:</strong> Creator (default)</p>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/upload"
              className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg"
            >
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-bold text-gray-900 mb-2">Upload Content</h3>
              <p className="text-sm text-gray-600">Upload and certify your photos/videos with cryptographic receipts</p>
              <div className="mt-4 text-blue-600 font-semibold text-sm">
                Get Started →
              </div>
            </Link>
            <Link
              href="/dashboard/receipts"
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
            >
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-bold text-gray-900 mb-2">View Receipts</h3>
              <p className="text-sm text-gray-600">Manage your cryptographic receipts and provenance proof</p>
              <div className="mt-4 text-gray-600 font-semibold text-sm">
                View All →
              </div>
            </Link>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 opacity-50">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-bold text-gray-900 mb-2">Settings</h3>
              <p className="text-sm text-gray-600">Coming soon: Configure your account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
