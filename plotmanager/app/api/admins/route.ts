import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
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

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: only super admins can create admins' }, { status: 403 })
    }

    const companyId = profile.company_id!
    const body = await request.json()

    const parsed = createAdminSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Create auth user (no email confirmation)
    const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.full_name },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: newAuthUser.user.id,
        email: parsed.data.email,
        full_name: parsed.data.full_name,
        role: 'admin',
        company_id: companyId,
      })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
