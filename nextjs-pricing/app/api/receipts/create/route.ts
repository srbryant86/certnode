import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateES256KeyPair, signReceipt } from '@/lib/crypto/sign'
import { computeStringSHA256 } from '@/lib/crypto/hash'

export async function POST(request: NextRequest) {
  try {
    console.log('[Receipt API] Starting receipt creation...')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log('[Receipt API] Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[Receipt API] Authenticated user:', userId)

    // Parse request body
    const { contentId, sha256Hash, filename, contentType, fileSize } = await request.json()
    console.log('[Receipt API] Request params:', { contentId, filename, contentType, fileSize })

    if (!contentId || !sha256Hash) {
      console.log('[Receipt API] Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get admin client (bypasses RLS)
    console.log('[Receipt API] Creating Supabase admin client...')
    const supabase = createAdminClient()

    // Verify content belongs to user
    console.log('[Receipt API] Verifying content ownership...')
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', userId)
      .single()

    if (contentError || !content) {
      console.log('[Receipt API] Content not found:', contentError)
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }
    console.log('[Receipt API] Content verified')

    // Generate ES256 key pair for this receipt
    console.log('[Receipt API] Generating ES256 key pair...')
    let publicKey: string, privateKey: string
    try {
      const keyPair = await generateES256KeyPair()
      publicKey = keyPair.publicKey
      privateKey = keyPair.privateKey
      console.log('[Receipt API] Key pair generated successfully')
    } catch (error) {
      console.error('[Receipt API] Key generation failed:', error)
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
    console.log('[Receipt API] Computing receipt hash...')
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
      console.log('[Receipt API] Hash computed successfully')
    } catch (error) {
      console.error('[Receipt API] Hash computation failed:', error)
      return NextResponse.json(
        { error: 'Failed to compute receipt hash. Please try again.' },
        { status: 500 }
      )
    }

    // Sign the receipt with ES256
    console.log('[Receipt API] Signing receipt...')
    let signature: string
    try {
      signature = await signReceipt(receiptData, privateKey)
      console.log('[Receipt API] Receipt signed successfully, signature length:', signature.length)
    } catch (error) {
      console.error('[Receipt API] Signature generation failed:', error)
      return NextResponse.json(
        { error: `Failed to sign receipt: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Store receipt in database
    console.log('[Receipt API] Storing receipt in database...')
    const { data: receipt, error: receiptError} = await supabase
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
      console.error('[Receipt API] Database insert failed:', receiptError)
      return NextResponse.json({
        error: `Failed to create receipt: ${receiptError.message || 'Database error'}`
      }, { status: 500 })
    }
    console.log('[Receipt API] Receipt stored successfully:', receipt.id)

    // Update content status to certified
    console.log('[Receipt API] Updating content status to certified...')
    await supabase
      .from('content')
      .update({ status: 'certified' })
      .eq('id', contentId)

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
