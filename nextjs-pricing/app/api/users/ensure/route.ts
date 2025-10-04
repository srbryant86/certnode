import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = createAdminClient()

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return NextResponse.json({ exists: true })
    }

    // Create user record
    const email = user.emailAddresses[0]?.emailAddress || `${userId}@clerk.user`

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        role: 'creator',
        tier: 'free',
      })

    if (insertError) {
      console.error('User creation error:', insertError)
      return NextResponse.json(
        { error: `Failed to create user: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ created: true })

  } catch (error) {
    console.error('Ensure user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
