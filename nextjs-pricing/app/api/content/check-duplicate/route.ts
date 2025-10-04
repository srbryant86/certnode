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

    // Check for existing content with same hash
    const { data: existingContent, error } = await supabase
      .from('content')
      .select('user_id, filename, created_at')
      .eq('sha256_hash', sha256Hash)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Duplicate Check] Query failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      isDuplicate: !!existingContent,
      existingContent: existingContent || null,
    })

  } catch (error) {
    console.error('[Duplicate Check] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
