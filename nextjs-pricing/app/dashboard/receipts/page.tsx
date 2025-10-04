import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReceiptsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in' as any)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Receipts
              </h1>
              <p className="text-gray-600">
                Cryptographic proofs of your certified content
              </p>
            </div>
            <Link
              href="/dashboard/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              + Upload Content
            </Link>
          </div>

          {/* Placeholder - will add actual receipts list */}
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No receipts yet</h2>
            <p className="text-gray-600 mb-6">
              Upload your first photo or video to generate a cryptographic receipt
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
