import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify target belongs to same company and is not a super_admin
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('id, role, company_id')
      .eq('id', id)
      .eq('company_id', profile.company_id!)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (targetProfile.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot remove a super admin' }, { status: 403 })
    }

    // Delete profile then auth user
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', id)

    await adminClient.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
