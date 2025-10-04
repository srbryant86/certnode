import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string

    if (!file || !fileName) {
      return NextResponse.json({ error: 'Missing file or fileName' }, { status: 400 })
    }

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    const supabase = createAdminClient()

    // Upload using admin client (bypasses RLS)
    const filePath = `${userId}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from('content-uploads')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Storage Upload] Failed:', uploadError)
      return NextResponse.json({
        error: `Upload failed: ${uploadError.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      storagePath: filePath
    })

  } catch (error) {
    console.error('[Storage Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
