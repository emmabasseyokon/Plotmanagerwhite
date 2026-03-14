import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicBuyerFormSchema } from '@/lib/validations'
import { generateInstallmentSchedule } from '@/lib/schedule'

async function getCompanyBySlug(slug: string) {
  const adminClient = createAdminClient()

  const { data: company } = await adminClient
    .from('companies')
    .select('id, name, slug, form_enabled')
    .eq('slug', slug)
    .single()

  return company
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (!(company as any).form_enabled) {
      return NextResponse.json({ error: 'Form is not enabled' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: estates } = await adminClient
      .from('estates')
      .select('id, name, location, price_per_plot')
      .eq('company_id', company.id)
      .eq('status', 'active')
      .gt('available_plots', 0)
      .order('name')

    return NextResponse.json({
      company: { name: company.name, slug: company.slug },
      estates: (estates || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        price_per_plot: e.price_per_plot,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (!(company as any).form_enabled) {
      return NextResponse.json({ error: 'Form is not available' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = publicBuyerFormSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data
    const adminClient = createAdminClient()

    // Verify estate belongs to company and has available plots
    const { data: estate } = await adminClient
      .from('estates')
      .select('id, name, location, price_per_plot, available_plots')
      .eq('id', data.estate_id)
      .eq('company_id', company.id)
      .single()

    if (!estate) {
      return NextResponse.json({ error: 'Estate not found' }, { status: 404 })
    }

    if ((estate as any).available_plots < (data.number_of_plots || 1)) {
      return NextResponse.json({ error: 'Not enough available plots in this estate' }, { status: 400 })
    }

    // Duplicate check: same email + estate in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await adminClient
      .from('buyers')
      .select('id')
      .eq('email', data.email)
      .eq('estate_id', data.estate_id)
      .eq('company_id', company.id)
      .gte('created_at', oneDayAgo)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'A registration with this email for this estate was already submitted recently. Please contact the company directly.' },
        { status: 409 }
      )
    }

    // Calculate total amount
    const pricePerPlot = (estate as any).price_per_plot || 0
    const numberOfPlots = data.number_of_plots || 1
    const totalAmount = pricePerPlot * numberOfPlots

    // Build notes with next-of-kin and referral info
    const notesParts: string[] = []
    if (data.notes) notesParts.push(data.notes)
    if (data.gender) notesParts.push(`Gender: ${data.gender}`)
    if (data.city || data.state) notesParts.push(`Location: ${[data.city, data.state].filter(Boolean).join(', ')}`)
    if (data.next_of_kin_name) {
      notesParts.push(
        `Next of Kin: ${data.next_of_kin_name}` +
        (data.next_of_kin_relationship ? ` (${data.next_of_kin_relationship})` : '') +
        (data.next_of_kin_phone ? ` - ${data.next_of_kin_phone}` : '') +
        (data.next_of_kin_address ? ` - ${data.next_of_kin_address}` : '')
      )
    }
    if (data.referral_source) {
      notesParts.push(
        `Referral: ${data.referral_source}` +
        (data.referral_phone ? ` (${data.referral_phone})` : '')
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const isOutright = data.payment_type === 'outright'
    const initialDeposit = data.initial_deposit || 0

    const insertData: any = {
      company_id: company.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      home_address: data.home_address || null,
      estate_id: data.estate_id,
      plot_location: (estate as any).location || null,
      plot_size: numberOfPlots > 1 ? `${numberOfPlots} plots` : null,
      purchase_date: today,
      total_amount: totalAmount,
      amount_paid: isOutright ? totalAmount : initialDeposit,
      payment_status: isOutright ? 'fully_paid' : 'installment',
      notes: notesParts.length > 0 ? notesParts.join('\n') : null,
    }

    // Installment plan metadata
    if (!isOutright && data.installment_duration) {
      insertData.has_installment_plan = true
      insertData.plan_duration_months = data.installment_duration
      insertData.plan_start_date = today
      insertData.initial_deposit = initialDeposit
      insertData.next_payment_date = today
    }

    // Convert empty dates to null
    const dateFields = ['purchase_date', 'next_payment_date', 'plan_start_date']
    for (const field of dateFields) {
      if (insertData[field] === '') insertData[field] = null
    }

    const { data: buyer, error: buyerError } = await adminClient
      .from('buyers')
      .insert(insertData)
      .select()
      .single()

    if (buyerError) {
      return NextResponse.json({ error: buyerError.message }, { status: 500 })
    }

    // Decrement plots if outright
    if (isOutright) {
      const newAvailable = Math.max(0, (estate as any).available_plots - numberOfPlots)
      await adminClient
        .from('estates')
        .update({ available_plots: newAvailable })
        .eq('id', data.estate_id)
    }

    // Generate installment schedule
    if (!isOutright && data.installment_duration && buyer) {
      const schedule = generateInstallmentSchedule({
        total_amount: totalAmount,
        initial_deposit: initialDeposit,
        duration_months: data.installment_duration,
        start_date: today,
      })

      const scheduleEntries = schedule.map((entry) => ({
        buyer_id: (buyer as any).id,
        company_id: company.id,
        installment_number: entry.installment_number,
        due_date: entry.due_date,
        expected_amount: entry.expected_amount,
      }))

      await adminClient.from('payment_schedules').insert(scheduleEntries)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
