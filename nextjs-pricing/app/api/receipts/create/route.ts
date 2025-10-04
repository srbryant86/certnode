import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateES256KeyPair, signReceipt } from '@/lib/crypto/sign'
import { computeStringSHA256 } from '@/lib/crypto/hash'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { contentId, sha256Hash, filename, contentType, fileSize } = await request.json()

    if (!contentId || !sha256Hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get admin client (bypasses RLS)
    const supabase = createAdminClient()

    // Verify content belongs to user
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', userId)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Generate ES256 key pair for this receipt
    let publicKey: string, privateKey: string
    try {
      const keyPair = await generateES256KeyPair()
      publicKey = keyPair.publicKey
      privateKey = keyPair.privateKey
    } catch (error) {
      console.error('Key generation failed:', error)
      return NextResponse.json(
        { error: 'Failed to generate cryptographic keys. Please try again.' },
        { status: 500 }
      )
    }

    // Generate receipt ID
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Receipt data
    const receiptData = {
      id: receiptId,
      type: 'content',
      user_id: userId,
      data: {
        content_id: contentId,
        filename,
        content_type: contentType,
        file_size: fileSize,
        sha256_hash: sha256Hash,
        certified_at: new Date().toISOString(),
      },
      parent_ids: [],
      depth: 0,
      content_id: contentId,
    }

    // Compute receipt hash (SHA-256 of receipt data)
    let receiptHash: string
    try {
      const receiptDataString = JSON.stringify({
        id: receiptData.id,
        type: receiptData.type,
        data: receiptData.data,
        parent_ids: receiptData.parent_ids,
        depth: receiptData.depth,
      })
      receiptHash = await computeStringSHA256(receiptDataString)
    } catch (error) {
      console.error('Hash computation failed:', error)
      return NextResponse.json(
        { error: 'Failed to compute receipt hash. Please try again.' },
        { status: 500 }
      )
    }

    // Sign the receipt with ES256
    let signature: string
    try {
      signature = await signReceipt(receiptData, privateKey)
    } catch (error) {
      console.error('Signature generation failed:', error)
      return NextResponse.json(
        { error: `Failed to sign receipt: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Store receipt in database
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        id: receiptId,
        user_id: userId,
        type: 'content',
        data: receiptData.data,
        hash: receiptHash,
        signature,
        public_key: publicKey,
        parent_ids: [],
        depth: 0,
        content_id: contentId,
        metadata: {
          filename,
          content_type: contentType,
          file_size: fileSize,
        },
      })
      .select()
      .single()

    if (receiptError) {
      console.error('Receipt creation error:', receiptError)
      return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        hash: receipt.hash,
        signature: receipt.signature,
        public_key: receipt.public_key,
        created_at: receipt.created_at,
      },
    })

  } catch (error) {
    console.error('Receipt creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
