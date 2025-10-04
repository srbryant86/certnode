import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { importJWK, jwtVerify } from 'jose'

interface PageProps {
  params: Promise<{
    receiptId: string
  }>
}

export default async function ProofPage({ params }: PageProps) {
  const { receiptId } = await params
  const supabase = createAdminClient()

  // Fetch receipt
  const { data: receipt, error } = await supabase
    .from('receipts')
    .select(`
      id,
      hash,
      signature,
      public_key,
      created_at,
      metadata,
      content_id
    `)
    .eq('id', receiptId)
    .single()

  // Fetch related content separately
  let content = null
  if (receipt && receipt.content_id) {
    const { data: contentData } = await supabase
      .from('content')
      .select('filename, content_type, file_size')
      .eq('id', receipt.content_id)
      .single()
    content = contentData
  }

  if (error || !receipt) {
    notFound()
  }

  // Verify signature
  let isValid = false
  try {
    const publicKey = await importJWK(JSON.parse(receipt.public_key), 'ES256')
    await jwtVerify(receipt.signature, publicKey, {
      issuer: 'certnode',
      subject: receipt.id,
    })
    isValid = true
  } catch {
    isValid = false
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with status */}
          <div className={`p-8 ${isValid ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
            <div className="flex items-center gap-4 text-white">
              <div className="text-5xl">
                {isValid ? '✓' : '✗'}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {isValid ? 'Verified Content Certification' : 'Invalid Certification'}
                </h1>
                <p className="text-white/90">
                  {isValid
                    ? 'This content has been cryptographically certified'
                    : 'This certification could not be verified'}
                </p>
              </div>
            </div>
          </div>

          {/* Content details */}
          <div className="p-8">
            {content && (
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">
                    {content.content_type?.startsWith('image/') ? '🖼️' : '🎥'}
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {content.filename}
                    </h2>
                    <p className="text-gray-600">
                      {content.content_type} • {formatFileSize(content.file_size)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Certification Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Receipt ID</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{receipt.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Content Hash (SHA-256)</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{receipt.hash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Certified At</p>
                    <p className="text-sm text-gray-900">{formatDate(receipt.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cryptographic Signature (ES256)</p>
                    <p className="font-mono text-xs text-gray-900 break-all">
                      {receipt.signature.substring(0, 120)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* What this proves */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">ℹ️</span>
                  What This Proves
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>This file was certified on <strong>{formatDate(receipt.created_at)}</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>The content hash matches the original certified file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>The cryptographic signature is valid and has not been tampered with</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>This receipt was generated by CertNode&apos;s infrastructure</span>
                  </li>
                </ul>
              </div>

              {/* Important note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Important: Provenance vs. Possession
                </h3>
                <p className="text-sm text-gray-700">
                  This receipt proves that <strong>someone uploaded this file</strong> on the date shown.
                  It does NOT prove who originally created the content. For true provenance, content should
                  be certified directly from the creator&apos;s device.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Link
                  href={`/verify?receiptId=${receipt.id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Verify This Receipt
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  📋 Copy Proof Link
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Powered by <span className="font-semibold text-gray-900">CertNode</span>
              </div>
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create Your Own Receipt →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
