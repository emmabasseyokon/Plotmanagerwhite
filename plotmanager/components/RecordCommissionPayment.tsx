'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RecordCommissionPaymentProps {
  commissionId: string
  commissionAmount: number
  amountPaid: number
}

export function RecordCommissionPayment({ commissionId, commissionAmount, amountPaid }: RecordCommissionPaymentProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outstanding = commissionAmount - amountPaid
  const [amount, setAmount] = useState(outstanding > 0 ? String(outstanding) : '')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commission_id: commissionId,
          amount: parseFloat(amount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record commission payment')
      }

      setIsOpen(false)
      setAmount('')
      setReference('')
      setNotes('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (outstanding <= 0) return null

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        <CreditCard className="w-4 h-4 mr-2" />
        Pay Commission
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Commission Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            Commission: <span className="font-semibold">{formatCurrency(commissionAmount)}</span>
            {' · '}Paid: <span className="font-semibold">{formatCurrency(amountPaid)}</span>
            {' · '}Outstanding: <span className="font-semibold">{formatCurrency(outstanding)}</span>
          </div>

          <Input
            label="Amount *"
            type="number"
            placeholder="50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min={1}
          />
          <Input
            label="Payment Date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Method *
            </label>
            <select
              className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="online">Online</option>
            </select>
          </div>
          <Input
            label="Reference"
            placeholder="e.g. TRF-12345"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              className="flex w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[80px]"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
