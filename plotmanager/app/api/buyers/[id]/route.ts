import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, validationError, serverError } from '@/lib/api-helpers'
import { buyerSchema } from '@/lib/validations'
import { generateInstallmentSchedule } from '@/lib/schedule'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

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
  } catch (err) {
    return serverError(err, 'buyers/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

    const body = await request.json()
    const parsed = buyerSchema.partial().safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

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

    // Convert empty strings to null for DB compatibility
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === '') updateData[key] = null
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
      return serverError(error, 'buyers/[id]')
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
        .in('status', ['unpaid', 'overdue'])

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
  } catch (err) {
    return serverError(err, 'buyers/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

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
      return serverError(error, 'buyers/[id]')
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
  } catch (err) {
    return serverError(err, 'buyers/[id]')
  }
}
