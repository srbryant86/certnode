import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { importJWK, jwtVerify } from 'jose'

export async function POST(request: NextRequest) {
  try {
    const { receiptId, receiptJson } = await request.json()

    if (!receiptId && !receiptJson) {
      return NextResponse.json({ error: 'Receipt ID or JSON required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let receipt

    // If receiptJson provided, parse it and fetch by ID
    if (receiptJson) {
      try {
        const parsed = typeof receiptJson === 'string' ? JSON.parse(receiptJson) : receiptJson
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', parsed.receipt_id)
          .single()

        if (error || !data) {
          return NextResponse.json({
            valid: false,
            error: 'Receipt not found in database'
          })
        }
        receipt = data
      } catch (e) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid receipt JSON format'
        })
      }
    } else {
      // Fetch by receipt ID
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', receiptId)
        .single()

      if (error || !data) {
        return NextResponse.json({
          valid: false,
          error: 'Receipt not found'
        })
      }
      receipt = data
    }

    // Verify ES256 signature
    try {
      const publicKey = await importJWK(JSON.parse(receipt.public_key), 'ES256')
      const { payload } = await jwtVerify(receipt.signature, publicKey, {
        issuer: 'certnode',
        subject: receipt.id,
      })

      // Signature is valid
      return NextResponse.json({
        valid: true,
        receipt: {
          id: receipt.id,
          hash: receipt.hash,
          signature: receipt.signature,
          created_at: receipt.created_at,
          metadata: receipt.metadata,
          verified_at: new Date().toISOString(),
        },
        payload,
      })

    } catch (verifyError) {
      // Signature verification failed
      return NextResponse.json({
        valid: false,
        error: 'Invalid signature - receipt may have been tampered with',
        receipt: {
          id: receipt.id,
          created_at: receipt.created_at,
        }
      })
    }

  } catch (error) {
    console.error('[Verify] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
