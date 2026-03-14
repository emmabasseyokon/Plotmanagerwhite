import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
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
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const companyId = profile.company_id!
    const adminClient = createAdminClient()

    // Verify ownership
    const { data: existing } = await adminClient
      .from('payment_schedules')
      .select('id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const allowedFields: Record<string, unknown> = {}
    if (body.due_date) allowedFields.due_date = body.due_date
    if (body.expected_amount !== undefined) allowedFields.expected_amount = body.expected_amount

    const { data: entry, error } = await adminClient
      .from('payment_schedules')
      .update(allowedFields)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entry })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
