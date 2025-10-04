'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

interface Receipt {
  id: string
  created_at: string
  hash: string
  signature: string
  metadata: {
    filename: string
    content_type: string
    file_size: number
  }
  content: {
    id: string
    filename: string
    content_type: string
    file_size: number
    storage_path: string
  }
}

export default function ReceiptsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in' as any)
      return
    }

    if (isLoaded && user) {
      fetchReceipts()
    }
  }, [isLoaded, user, router])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/receipts/list')

      if (!response.ok) {
        throw new Error('Failed to fetch receipts')
      }

      const data = await response.json()
      setReceipts(data.receipts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadReceipt = (receipt: Receipt) => {
    // Create receipt object with all details
    const receiptData = {
      receipt_id: receipt.id,
      content_hash: receipt.hash,
      signature: receipt.signature,
      content: {
        filename: receipt.content.filename,
        content_type: receipt.content.content_type,
        file_size: receipt.content.file_size,
      },
      certified_at: receipt.created_at,
      algorithm: 'ES256',
      issuer: 'CertNode',
    }

    // Convert to JSON
    const json = JSON.stringify(receiptData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Trigger download
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receipt.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <p className="text-center text-gray-600">Loading receipts...</p>
          </div>
        </div>
      </div>
    )
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {receipts.length === 0 ? (
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
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {receipt.content.content_type.startsWith('image/') ? '🖼️' : '🎥'}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {receipt.content.filename}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(receipt.content.file_size)} • {receipt.content.content_type}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Certified</p>
                          <p className="font-mono text-gray-900">{formatDate(receipt.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Receipt ID</p>
                          <p className="font-mono text-xs text-gray-900 truncate">
                            {receipt.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Content Hash</p>
                          <p className="font-mono text-xs text-gray-900 truncate">
                            {receipt.hash}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Signature</p>
                          <p className="font-mono text-xs text-gray-900 truncate">
                            {receipt.signature.substring(0, 40)}...
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      <Link
                        href={`/proof/${receipt.id}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        📋 Share Proof
                      </Link>
                      <button
                        onClick={() => downloadReceipt(receipt)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Download Receipt
                      </button>
                      <Link
                        href={`/verify?receiptId=${receipt.id}`}
                        className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Verify
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
