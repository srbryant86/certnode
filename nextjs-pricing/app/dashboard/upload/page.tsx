'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { computeFileSHA256 } from '@/lib/crypto/hash'

export default function UploadPage() {
  const { user } = useUser()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB')
        return
      }

      // Check file type
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        setError('Only images and videos are supported')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const supabase = createClient()

      // Step 0: Ensure user exists in database
      setProgress(5)
      await fetch('/api/users/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      // Step 1: Compute SHA-256 hash
      setProgress(10)
      const sha256Hash = await computeFileSHA256(file)

      // Step 1.5: Check for duplicate content (fraud detection)
      setProgress(20)
      const { data: existingContent } = await supabase
        .from('content')
        .select('user_id, filename, created_at')
        .eq('sha256_hash', sha256Hash)
        .single()

      if (existingContent && existingContent.user_id !== user.id) {
        const uploadDate = new Date(existingContent.created_at).toLocaleDateString()
        const proceed = window.confirm(
          `⚠️ PROVENANCE WARNING\n\n` +
          `This exact file was already certified by another user on ${uploadDate}.\n\n` +
          `Original filename: ${existingContent.filename}\n\n` +
          `Uploading this file does NOT prove you created it. It only proves you have a copy.\n\n` +
          `Do you still want to upload?`
        )

        if (!proceed) {
          setUploading(false)
          setProgress(0)
          return
        }
      }

      // Step 2: Upload to Supabase Storage
      setProgress(30)
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('content-uploads')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Step 3: Create content record via API (bypasses RLS)
      setProgress(60)
      const contentResponse = await fetch('/api/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
          storagePath: filePath,
          sha256Hash,
          deviceInfo: existingContent ? {
            duplicate_detection: {
              is_original_upload: false,
              duplicate_of_user: existingContent.user_id,
              original_upload_date: existingContent.created_at,
              warning_acknowledged: true,
            }
          } : null,
        }),
      })

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to create content record')
      }

      const { content } = await contentResponse.json()

      // Step 4: Generate cryptographic receipt
      setProgress(80)
      const response = await fetch('/api/receipts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          sha256Hash,
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate receipt')
      }

      const { receipt } = await response.json()

      // Content status is updated to 'certified' by the receipt API
      setProgress(100)
      setSuccess(true)

      // Redirect to receipts list after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/receipts')
      }, 2000)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Content
          </h1>
          <p className="text-gray-600 mb-8">
            Upload photos or videos to generate cryptographic receipts for provenance proof
          </p>

          {/* Upload Area */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">✓ Upload successful! Redirecting to receipt...</p>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {progress < 10 && 'Preparing upload...'}
                {progress >= 10 && progress < 20 && 'Computing SHA-256 hash...'}
                {progress >= 20 && progress < 30 && 'Checking for duplicates...'}
                {progress >= 30 && progress < 60 && 'Uploading to secure storage...'}
                {progress >= 60 && progress < 80 && 'Creating content record...'}
                {progress >= 80 && progress < 100 && 'Generating cryptographic receipt...'}
                {progress === 100 && 'Complete!'}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            {uploading ? 'Processing...' : 'Upload & Generate Receipt'}
          </button>

          {/* Info Box */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">What happens when you upload?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span><strong>SHA-256 Hash:</strong> We compute a cryptographic fingerprint of your file</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span><strong>Duplicate Detection:</strong> Check if this exact file was already certified by someone else</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span><strong>Secure Storage:</strong> File uploaded to encrypted cloud storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span><strong>ES256 Signature:</strong> Generate cryptographic proof using ECDSA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">5.</span>
                <span><strong>Receipt Creation:</strong> Tamper-evident receipt linking to the content</span>
              </li>
            </ul>
          </div>

          {/* Provenance Warning */}
          <div className="mt-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">⚠️ Important: Provenance vs. Possession</h3>
            <p className="text-sm text-gray-700 mb-3">
              A receipt proves <strong>you uploaded</strong> this file, not that <strong>you created</strong> it.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• If someone else already certified this exact file, you&apos;ll be warned</li>
              <li>• Downloading a file and re-uploading it doesn&apos;t transfer ownership</li>
              <li>• For true provenance, upload directly from your camera/phone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
