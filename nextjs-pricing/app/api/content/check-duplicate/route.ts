import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sha256Hash } = await request.json()

    if (!sha256Hash) {
      return NextResponse.json({ error: 'Missing sha256Hash' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if THIS USER already uploaded this file
    const { data: ownUpload } = await supabase
      .from('content')
      .select('id, filename, created_at')
      .eq('sha256_hash', sha256Hash)
      .eq('user_id', userId)
      .single()

    if (ownUpload) {
      // User already uploaded this exact file
      return NextResponse.json({
        isDuplicate: true,
        isOwnUpload: true,
        existingContent: ownUpload,
      })
    }

    // Check if ANOTHER USER uploaded this file (provenance warning)
    const { data: otherUserUpload, error } = await supabase
      .from('content')
      .select('user_id, filename, created_at')
      .eq('sha256_hash', sha256Hash)
      .neq('user_id', userId)
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Duplicate Check] Query failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      isDuplicate: !!otherUserUpload,
      isOwnUpload: false,
      existingContent: otherUserUpload || null,
    })

  } catch (error) {
    console.error('[Duplicate Check] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
