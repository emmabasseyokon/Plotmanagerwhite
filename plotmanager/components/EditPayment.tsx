'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface EditPaymentProps {
  payment: {
    id: string
    amount: number
    payment_date: string
    payment_method: string
    reference: string | null
    notes: string | null
  }
}

export function EditPayment({ payment }: EditPaymentProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(String(payment.amount))
  const [paymentDate, setPaymentDate] = useState(payment.payment_date)
  const [paymentMethod, setPaymentMethod] = useState(payment.payment_method)
  const [reference, setReference] = useState(payment.reference || '')
  const [notes, setNotes] = useState(payment.notes || '')

  const handleOpen = () => {
    // Reset to current values when opening
    setAmount(String(payment.amount))
    setPaymentDate(payment.payment_date)
    setPaymentMethod(payment.payment_method)
    setReference(payment.reference || '')
    setNotes(payment.notes || '')
    setError(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update payment')
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Edit Payment"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
            Original amount: <span className="font-semibold">{formatCurrency(payment.amount)}</span>
          </div>

          <Input
            label="Amount *"
            type="number"
            placeholder="500000"
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
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
