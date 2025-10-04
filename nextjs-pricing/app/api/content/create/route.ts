import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, contentType, fileSize, storagePath, sha256Hash, deviceInfo } = await request.json()

    if (!filename || !sha256Hash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create content record (bypasses RLS with admin client)
    const { data: content, error: contentError } = await supabase
      .from('content')
      .insert({
        user_id: userId,
        filename,
        content_type: contentType,
        file_size: fileSize,
        storage_path: storagePath,
        sha256_hash: sha256Hash,
        status: 'processing',
        device_info: deviceInfo,
      })
      .select()
      .single()

    if (contentError) {
      console.error('[Content Create] Database insert failed:', contentError)
      return NextResponse.json({
        error: `Failed to create content: ${contentError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, content })

  } catch (error) {
    console.error('[Content Create] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
