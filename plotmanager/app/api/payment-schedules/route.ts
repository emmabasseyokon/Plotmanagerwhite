import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
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

    const buyerId = request.nextUrl.searchParams.get('buyer_id')
    if (!buyerId) {
      return NextResponse.json({ error: 'buyer_id is required' }, { status: 400 })
    }

    const { data: entries, error } = await adminClient
      .from('payment_schedules')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('company_id', companyId)
      .order('installment_number', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark overdue entries on read
    const today = new Date().toISOString().split('T')[0]
    const updatedEntries = []
    for (const entry of entries || []) {
      if ((entry.status === 'pending' || entry.status === 'partial') && entry.due_date < today) {
        await adminClient
          .from('payment_schedules')
          .update({ status: 'overdue' })
          .eq('id', entry.id)
        updatedEntries.push({ ...entry, status: 'overdue' })
      } else {
        updatedEntries.push(entry)
      }
    }

    return NextResponse.json({ entries: updatedEntries })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
