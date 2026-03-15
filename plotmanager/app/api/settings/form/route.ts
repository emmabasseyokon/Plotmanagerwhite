import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireSuperAdmin, serverError } from '@/lib/api-helpers'

export async function PUT(request: NextRequest) {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { auth } = result

    const forbidden = requireSuperAdmin(auth)
    if (forbidden) return forbidden

    const body = await request.json()
    const { form_enabled } = body

    if (typeof form_enabled !== 'boolean') {
      return NextResponse.json({ error: 'form_enabled must be a boolean' }, { status: 400 })
    }

    const { error } = await auth.adminClient
      .from('companies')
      .update({ form_enabled })
      .eq('id', auth.companyId)

    if (error) {
      return serverError(error, 'PUT /api/settings/form')
    }

    return NextResponse.json({ success: true, form_enabled })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
