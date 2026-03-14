import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_COMPANY_ID } from '@/lib/config'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('[Onboarding] user:', user?.id ?? 'null')

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Onboarding] APP_COMPANY_ID:', APP_COMPANY_ID || 'EMPTY')

    if (!APP_COMPANY_ID) {
      return NextResponse.json({ error: 'APP_COMPANY_ID is not configured' }, { status: 500 })
    }

    const admin = createAdminClient()

    // Create or update profile — assign to the pre-seeded company
    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        role: 'admin',
        company_id: APP_COMPANY_ID,
      })
      .select()

    console.log('[Onboarding] upsert result:', JSON.stringify(profileData), 'error:', profileError?.message ?? 'none')

    if (profileError) {
      console.error('[Onboarding] Profile creation failed:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
