import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('[Test Supabase] Starting connection test...')
    console.log('[Test Supabase] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('[Test Supabase] Anon key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('[Test Supabase] Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const supabase = createAdminClient()

    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      console.error('[Test Supabase] Query failed:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
      }, { status: 500 })
    }

    console.log('[Test Supabase] Query succeeded, found', data?.length || 0, 'users')

    return NextResponse.json({
      success: true,
      message: 'Supabase connection works!',
      usersFound: data?.length || 0,
      envVarsSet: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })

  } catch (error) {
    console.error('[Test Supabase] Exception:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
