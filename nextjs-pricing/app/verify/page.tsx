'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface VerificationResult {
  valid: boolean
  error?: string
  receipt?: {
    id: string
    hash: string
    signature: string
    created_at: string
    metadata?: any
    verified_at?: string
  }
  payload?: any
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const [receiptId, setReceiptId] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  // Pre-fill receipt ID from URL query parameter
  useEffect(() => {
    const receiptIdFromUrl = searchParams.get('receiptId')
    if (receiptIdFromUrl) {
      setReceiptId(receiptIdFromUrl)
    }
  }, [searchParams])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      setReceiptId('') // Clear receipt ID if file is selected
    }
  }

  const handleVerify = async () => {
    if (!receiptId && !receiptFile) {
      alert('Please enter a Receipt ID or upload a receipt JSON file')
      return
    }

    setVerifying(true)
    setResult(null)

    try {
      let body: any = {}

      if (receiptFile) {
        // Read file contents
        const fileText = await receiptFile.text()
        body.receiptJson = fileText
      } else {
        body.receiptId = receiptId.trim()
      }

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      setResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      })
    } finally {
      setVerifying(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Receipt
            </h1>
            <p className="text-gray-600">
              Verify the authenticity of a cryptographic receipt
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt ID
              </label>
              <input
                type="text"
                value={receiptId}
                onChange={(e) => {
                  setReceiptId(e.target.value)
                  setReceiptFile(null) // Clear file if ID is entered
                }}
                disabled={!!receiptFile || verifying}
                placeholder="rcpt_1234567890_abc123def"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300" />
              <span className="text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Receipt JSON
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                disabled={!!receiptId || verifying}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {receiptFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {receiptFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={(!receiptId && !receiptFile) || verifying}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            {verifying ? 'Verifying...' : 'Verify Receipt'}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-8">
              {result.valid ? (
                // Valid Receipt
                <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl">✅</div>
                    <div>
                      <h2 className="text-xl font-bold text-green-900">
                        Receipt Verified
                      </h2>
                      <p className="text-green-700">
                        This receipt is authentic and has not been tampered with
                      </p>
                    </div>
                  </div>

                  {result.receipt && (
                    <div className="mt-6 space-y-4 border-t border-green-200 pt-4">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Receipt ID</p>
                        <p className="font-mono text-sm text-green-900 break-all">
                          {result.receipt.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-green-700 font-medium">Content Hash (SHA-256)</p>
                        <p className="font-mono text-sm text-green-900 break-all">
                          {result.receipt.hash}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-green-700 font-medium">Certified At</p>
                        <p className="text-sm text-green-900">
                          {formatDate(result.receipt.created_at)}
                        </p>
                      </div>

                      {result.receipt.verified_at && (
                        <div>
                          <p className="text-sm text-green-700 font-medium">Verified At</p>
                          <p className="text-sm text-green-900">
                            {formatDate(result.receipt.verified_at)}
                          </p>
                        </div>
                      )}

                      {result.receipt.metadata && (
                        <div>
                          <p className="text-sm text-green-700 font-medium">Content Info</p>
                          <p className="text-sm text-green-900">
                            {result.receipt.metadata.filename || 'N/A'}
                            {result.receipt.metadata.content_type && ` • ${result.receipt.metadata.content_type}`}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-green-700 font-medium">Signature (ES256)</p>
                        <p className="font-mono text-xs text-green-900 break-all">
                          {result.receipt.signature.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Invalid Receipt
                <div className="border-2 border-red-500 rounded-lg p-6 bg-red-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl">❌</div>
                    <div>
                      <h2 className="text-xl font-bold text-red-900">
                        Verification Failed
                      </h2>
                      <p className="text-red-700">
                        {result.error || 'This receipt could not be verified'}
                      </p>
                    </div>
                  </div>

                  {result.receipt && (
                    <div className="mt-4 text-sm text-red-700">
                      <p>Receipt ID: <span className="font-mono">{result.receipt.id}</span></p>
                      {result.receipt.created_at && (
                        <p>Created: {formatDate(result.receipt.created_at)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">How Verification Works</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Receipt is retrieved from CertNode database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>ES256 signature is verified using the public key</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Content hash is checked for tampering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Result confirms receipt authenticity</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-gray-600">Loading verification page...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
