import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buyerSchema } from '@/lib/validations'
import { generateInstallmentSchedule } from '@/lib/schedule'

async function getAuthenticatedCompanyId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return profile.company_id!
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getAuthenticatedCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: buyer, error } = await adminClient
      .from('buyers')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    return NextResponse.json({ buyer })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getAuthenticatedCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = buyerSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get existing buyer with estate info
    const { data: existing } = await adminClient
      .from('buyers')
      .select('id, estate_id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const oldEstateId = (existing as any).estate_id as string | null
    const { installment_plan, ...updateFields } = parsed.data
    const updateData: any = { ...updateFields }
    if (updateData.estate_id === '') delete updateData.estate_id

    // Convert empty string dates to null (PostgreSQL rejects "" for DATE columns)
    const dateFields = ['purchase_date', 'next_payment_date', 'plan_start_date']
    for (const field of dateFields) {
      if (updateData[field] === '') updateData[field] = null
    }

    // Handle installment plan changes
    if (installment_plan !== undefined) {
      if (installment_plan?.enabled && installment_plan.duration_months && installment_plan.start_date) {
        updateData.has_installment_plan = true
        updateData.plan_duration_months = installment_plan.duration_months
        updateData.plan_start_date = installment_plan.start_date
        updateData.initial_deposit = installment_plan.initial_deposit || 0
      } else if (installment_plan && !installment_plan.enabled) {
        updateData.has_installment_plan = false
      }
    }

    const { data: buyer, error } = await adminClient
      .from('buyers')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const newEstateId = updateData.estate_id as string | undefined

    // If estate changed and buyer is fully_paid, adjust available_plots
    const { data: fullBuyer } = await adminClient
      .from('buyers').select('payment_status').eq('id', id).eq('company_id', companyId).single()

    if (newEstateId !== undefined && newEstateId !== oldEstateId && fullBuyer && (fullBuyer as any).payment_status === 'fully_paid') {
      // Increment old estate (plot freed up)
      if (oldEstateId) {
        const { data: oldEstate } = await adminClient
          .from('estates').select('available_plots, total_plots').eq('id', oldEstateId).single()
        if (oldEstate && (oldEstate as any).available_plots < (oldEstate as any).total_plots) {
          await adminClient.from('estates')
            .update({ available_plots: (oldEstate as any).available_plots + 1 })
            .eq('id', oldEstateId)
        }
      }
      // Decrement new estate (plot claimed)
      if (newEstateId) {
        const { data: newEstate } = await adminClient
          .from('estates').select('available_plots').eq('id', newEstateId).single()
        if (newEstate && (newEstate as any).available_plots > 0) {
          await adminClient.from('estates')
            .update({ available_plots: (newEstate as any).available_plots - 1 })
            .eq('id', newEstateId)
        }
      }
    }

    // Regenerate schedule if plan params changed
    if (installment_plan?.enabled && installment_plan.duration_months && installment_plan.start_date && buyer) {
      const totalAmount = (updateFields.total_amount ?? (buyer as any).total_amount) as number

      // Delete only pending entries (preserve paid/partial)
      await adminClient
        .from('payment_schedules')
        .delete()
        .eq('buyer_id', id)
        .eq('company_id', companyId)
        .in('status', ['pending', 'overdue'])

      const schedule = generateInstallmentSchedule({
        total_amount: totalAmount,
        initial_deposit: installment_plan.initial_deposit || 0,
        duration_months: installment_plan.duration_months,
        start_date: installment_plan.start_date,
      })

      // Check which installment numbers already exist (paid/partial)
      const { data: existingEntries } = await adminClient
        .from('payment_schedules')
        .select('installment_number')
        .eq('buyer_id', id)
        .eq('company_id', companyId)

      const existingNumbers = new Set((existingEntries || []).map((e: any) => e.installment_number))

      const newEntries = schedule
        .filter((entry) => !existingNumbers.has(entry.installment_number))
        .map((entry) => ({
          buyer_id: id,
          company_id: companyId,
          installment_number: entry.installment_number,
          due_date: entry.due_date,
          expected_amount: entry.expected_amount,
        }))

      if (newEntries.length > 0) {
        await adminClient.from('payment_schedules').insert(newEntries)
      }
    }

    return NextResponse.json({ buyer })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getAuthenticatedCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get buyer with estate and payment info before deleting
    const { data: existing } = await adminClient
      .from('buyers')
      .select('id, estate_id, payment_status')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const estateId = (existing as any).estate_id as string | null
    const wasFullyPaid = (existing as any).payment_status === 'fully_paid'

    const { error } = await adminClient
      .from('buyers')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Only increment available_plots if buyer had fully paid (plot was claimed)
    if (estateId && wasFullyPaid) {
      const { data: estate } = await adminClient
        .from('estates').select('available_plots, total_plots').eq('id', estateId).single()
      if (estate && (estate as any).available_plots < (estate as any).total_plots) {
        await adminClient.from('estates')
          .update({ available_plots: (estate as any).available_plots + 1 })
          .eq('id', estateId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
