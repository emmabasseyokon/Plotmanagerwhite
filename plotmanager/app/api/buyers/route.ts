import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buyerSchema } from '@/lib/validations'
import { generateInstallmentSchedule } from '@/lib/schedule'

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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = adminClient
      .from('buyers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('payment_status', status)
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data: buyers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ buyers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json()

    const parsed = buyerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { installment_plan, ...buyerFields } = parsed.data
    const insertData: any = { ...buyerFields, company_id: companyId }
    if (!insertData.estate_id) delete insertData.estate_id

    // Convert empty string dates to null (PostgreSQL rejects "" for DATE columns)
    const dateFields = ['purchase_date', 'next_payment_date', 'plan_start_date']
    for (const field of dateFields) {
      if (insertData[field] === '') insertData[field] = null
    }

    // Add installment plan metadata to buyer if enabled
    if (installment_plan?.enabled && installment_plan.duration_months && installment_plan.start_date) {
      insertData.has_installment_plan = true
      insertData.plan_duration_months = installment_plan.duration_months
      insertData.plan_start_date = installment_plan.start_date
      insertData.initial_deposit = installment_plan.initial_deposit || 0
      insertData.next_payment_date = installment_plan.start_date
    }

    const { data: buyer, error } = await adminClient
      .from('buyers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Decrement available_plots if buyer paid outright and has an estate
    if (insertData.payment_status === 'fully_paid' && insertData.estate_id) {
      const { data: estate } = await adminClient
        .from('estates')
        .select('available_plots')
        .eq('id', insertData.estate_id)
        .single()
      if (estate && (estate as any).available_plots > 0) {
        await adminClient
          .from('estates')
          .update({ available_plots: (estate as any).available_plots - 1 })
          .eq('id', insertData.estate_id)
      }
    }

    // Generate installment schedule if plan is enabled
    if (installment_plan?.enabled && installment_plan.duration_months && installment_plan.start_date && buyer) {
      const schedule = generateInstallmentSchedule({
        total_amount: buyerFields.total_amount,
        initial_deposit: installment_plan.initial_deposit || 0,
        duration_months: installment_plan.duration_months,
        start_date: installment_plan.start_date,
      })

      const scheduleEntries = schedule.map((entry) => ({
        buyer_id: (buyer as any).id,
        company_id: companyId,
        installment_number: entry.installment_number,
        due_date: entry.due_date,
        expected_amount: entry.expected_amount,
      }))

      await adminClient.from('payment_schedules').insert(scheduleEntries)
    }

    return NextResponse.json({ buyer }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
