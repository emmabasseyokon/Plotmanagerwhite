import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, validationError } from '@/lib/api-helpers'
import { paymentSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { userId, companyId, adminClient } = result.auth

    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    // Verify the buyer belongs to this company
    const { data: buyer, error: buyerError } = await adminClient
      .from('buyers')
      .select('id, total_amount, amount_paid, payment_status, estate_id')
      .eq('id', parsed.data.buyer_id)
      .eq('company_id', companyId)
      .single()

    if (buyerError || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const typedBuyer = buyer as { id: string; total_amount: number; amount_paid: number; payment_status: string; estate_id: string | null }

    // Record the payment
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .insert({
        company_id: companyId,
        buyer_id: parsed.data.buyer_id,
        amount: parsed.data.amount,
        payment_date: parsed.data.payment_date,
        payment_method: parsed.data.payment_method,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
        recorded_by: userId,
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    // Update buyer's amount_paid and payment_status
    const newAmountPaid = (typedBuyer.amount_paid || 0) + parsed.data.amount
    const totalAmount = typedBuyer.total_amount || 0
    const newPaymentStatus = newAmountPaid >= totalAmount ? 'fully_paid' : 'installment'

    const { error: updateError } = await adminClient
      .from('buyers')
      .update({ amount_paid: newAmountPaid, payment_status: newPaymentStatus })
      .eq('id', parsed.data.buyer_id)
      .eq('company_id', companyId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Decrement available_plots when buyer transitions to fully_paid
    if (newPaymentStatus === 'fully_paid' && typedBuyer.payment_status !== 'fully_paid' && typedBuyer.estate_id) {
      const { data: estate } = await adminClient
        .from('estates')
        .select('available_plots')
        .eq('id', typedBuyer.estate_id)
        .single()
      if (estate && (estate as any).available_plots > 0) {
        await adminClient
          .from('estates')
          .update({ available_plots: (estate as any).available_plots - 1 })
          .eq('id', typedBuyer.estate_id)
      }
    }

    // Link payment to installment schedule if buyer has a plan
    if (typedBuyer.payment_status !== 'fully_paid') {
      const { data: buyerPlan } = await adminClient
        .from('buyers')
        .select('has_installment_plan')
        .eq('id', parsed.data.buyer_id)
        .single()

      if (buyerPlan && (buyerPlan as any).has_installment_plan) {
        let remainingAmount = parsed.data.amount

        // If a specific schedule entry was provided, start there
        if (parsed.data.schedule_entry_id) {
          const { data: targetEntry } = await adminClient
            .from('payment_schedules')
            .select('*')
            .eq('id', parsed.data.schedule_entry_id)
            .eq('company_id', companyId)
            .single()

          if (targetEntry) {
            const entry = targetEntry as any
            const entryRemaining = entry.expected_amount - entry.paid_amount
            const applyAmount = Math.min(remainingAmount, entryRemaining)
            const newPaidAmount = entry.paid_amount + applyAmount
            const entryStatus = newPaidAmount >= entry.expected_amount ? 'paid' : 'partial'

            await adminClient
              .from('payment_schedules')
              .update({
                paid_amount: newPaidAmount,
                status: entryStatus,
                payment_id: (payment as any).id,
              })
              .eq('id', entry.id)

            remainingAmount -= applyAmount
          }
        }

        // Apply remaining amount to next unpaid entries (cascade overflow)
        while (remainingAmount > 0) {
          const { data: nextEntry } = await adminClient
            .from('payment_schedules')
            .select('*')
            .eq('buyer_id', parsed.data.buyer_id)
            .eq('company_id', companyId)
            .in('status', ['pending', 'partial', 'overdue'])
            .order('installment_number', { ascending: true })
            .limit(1)
            .single()

          if (!nextEntry) break

          const entry = nextEntry as any
          const entryRemaining = entry.expected_amount - entry.paid_amount
          const applyAmount = Math.min(remainingAmount, entryRemaining)
          const newPaidAmount = entry.paid_amount + applyAmount
          const entryStatus = newPaidAmount >= entry.expected_amount ? 'paid' : 'partial'

          await adminClient
            .from('payment_schedules')
            .update({
              paid_amount: newPaidAmount,
              status: entryStatus,
              payment_id: (payment as any).id,
            })
            .eq('id', entry.id)

          remainingAmount -= applyAmount
        }

        // Update buyer's next_payment_date to next unpaid installment
        const { data: nextDue } = await adminClient
          .from('payment_schedules')
          .select('due_date')
          .eq('buyer_id', parsed.data.buyer_id)
          .eq('company_id', companyId)
          .in('status', ['pending', 'partial', 'overdue'])
          .order('installment_number', { ascending: true })
          .limit(1)
          .single()

        if (nextDue) {
          await adminClient
            .from('buyers')
            .update({ next_payment_date: (nextDue as any).due_date })
            .eq('id', parsed.data.buyer_id)
        }
      }
    }

    return NextResponse.json({ payment, newAmountPaid, newPaymentStatus }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
