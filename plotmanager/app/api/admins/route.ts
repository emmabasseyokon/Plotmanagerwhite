import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireSuperAdmin, validationError } from '@/lib/api-helpers'
import { createAdminSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { auth } = result

    const forbidden = requireSuperAdmin(auth)
    if (forbidden) return forbidden

    const body = await request.json()
    const parsed = createAdminSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    // Create auth user (no email confirmation)
    const { data: newAuthUser, error: authError } = await auth.adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.full_name },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    const { error: profileError } = await auth.adminClient
      .from('profiles')
      .insert({
        id: newAuthUser.user.id,
        email: parsed.data.email,
        full_name: parsed.data.full_name,
        role: 'admin',
        company_id: auth.companyId,
      })

    if (profileError) {
      await auth.adminClient.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
