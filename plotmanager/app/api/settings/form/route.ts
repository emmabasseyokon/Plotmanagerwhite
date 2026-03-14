import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can manage form settings' }, { status: 403 })
    }

    const companyId = profile.company_id!
    const adminClient = createAdminClient()

    const body = await request.json()
    const { form_enabled } = body

    if (typeof form_enabled !== 'boolean') {
      return NextResponse.json({ error: 'form_enabled must be a boolean' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('companies')
      .update({ form_enabled })
      .eq('id', companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, form_enabled })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
