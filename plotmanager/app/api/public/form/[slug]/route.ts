import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicBuyerFormSchema } from '@/lib/validations'
import { generateInstallmentSchedule } from '@/lib/schedule'
import type { TablesInsert } from '@/types/database.types'

type PlotSizeEntry = { size: string; price: number; is_default?: boolean }

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

    if (!company.form_enabled) {
      return NextResponse.json({ error: 'Form is not enabled' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    const { data: estates } = await adminClient
      .from('estates')
      .select('id, name, location, price_per_plot, plot_sizes')
      .eq('company_id', company.id)
      .eq('status', 'active')
      .gt('available_plots', 0)
      .order('name')

    return NextResponse.json({
      company: { name: company.name, slug: company.slug },
      estates: (estates || []).map((e) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        price_per_plot: e.price_per_plot,
        plot_sizes: e.plot_sizes || [],
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

    if (!company.form_enabled) {
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
      .select('id, name, location, price_per_plot, available_plots, plot_sizes')
      .eq('id', data.estate_id)
      .eq('company_id', company.id)
      .single()

    if (!estate) {
      return NextResponse.json({ error: 'Estate not found' }, { status: 404 })
    }

    if (estate.available_plots < (data.number_of_plots || 1)) {
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

    // Calculate total amount — use plot_sizes price if buyer selected a specific size
    let pricePerPlot = estate.price_per_plot || 0
    const plotSizes = (estate.plot_sizes || []) as PlotSizeEntry[]
    if (data.plot_size && plotSizes.length > 0) {
      const matchedSize = plotSizes.find((ps) => ps.size === data.plot_size)
      if (matchedSize) {
        pricePerPlot = matchedSize.price
      }
    }
    const numberOfPlots = data.number_of_plots || 1
    const totalAmount = pricePerPlot * numberOfPlots

    const today = new Date().toISOString().split('T')[0]
    const isOutright = data.payment_type === 'outright'
    const initialDeposit = data.initial_deposit || 0

    const insertData: TablesInsert<'buyers'> = {
      company_id: company.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      gender: data.gender || null,
      home_address: data.home_address || null,
      city: data.city || null,
      state: data.state || null,
      estate_id: data.estate_id,
      plot_location: estate.location || null,
      plot_size: data.plot_size || null,
      number_of_plots: numberOfPlots,
      purchase_date: data.purchase_date || today,
      total_amount: totalAmount,
      amount_paid: isOutright ? totalAmount : initialDeposit,
      payment_status: isOutright ? 'fully_paid' : 'installment',
      next_of_kin_name: data.next_of_kin_name || null,
      next_of_kin_phone: data.next_of_kin_phone || null,
      next_of_kin_address: data.next_of_kin_address || null,
      next_of_kin_relationship: data.next_of_kin_relationship || null,
      referral_source: data.referral_source || null,
      referral_phone: data.referral_phone || null,
      notes: data.notes || null,
    }

    // Installment plan metadata
    if (!isOutright && data.installment_duration) {
      insertData.has_installment_plan = true
      insertData.plan_duration_months = data.installment_duration
      insertData.plan_start_date = data.plan_start_date || today
      insertData.initial_deposit = initialDeposit
      insertData.next_payment_date = data.plan_start_date || today
    }

    // Convert empty dates to null
    const dateFields = ['purchase_date', 'next_payment_date', 'plan_start_date'] as const
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

    // Auto-create payment record for initial amount paid (outright or initial deposit)
    if (buyer && (insertData.amount_paid ?? 0) > 0) {
      await adminClient.from('payments').insert({
        company_id: company.id,
        buyer_id: buyer.id,
        amount: insertData.amount_paid ?? 0,
        payment_date: insertData.purchase_date || today,
        payment_method: 'bank_transfer',
        reference: null,
        notes: isOutright ? 'Outright payment' : 'Initial deposit',
      })
    }

    // Decrement plots if outright
    if (isOutright) {
      const newAvailable = Math.max(0, estate.available_plots - numberOfPlots)
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
        start_date: data.plan_start_date || today,
      })

      const scheduleEntries = schedule.map((entry) => ({
        buyer_id: buyer.id,
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
