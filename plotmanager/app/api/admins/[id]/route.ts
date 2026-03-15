import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireSuperAdmin } from '@/lib/api-helpers'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { auth } = result

    const forbidden = requireSuperAdmin(auth)
    if (forbidden) return forbidden

    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Verify target belongs to same company and is not a super_admin
    const { data: targetProfile } = await auth.adminClient
      .from('profiles')
      .select('id, role, company_id')
      .eq('id', id)
      .eq('company_id', auth.companyId)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (targetProfile.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot remove a super admin' }, { status: 403 })
    }

    // Delete profile then auth user
    await auth.adminClient.from('profiles').delete().eq('id', id)
    await auth.adminClient.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
