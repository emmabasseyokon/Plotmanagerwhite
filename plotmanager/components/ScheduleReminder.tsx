'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Mail, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ScheduleReminderProps {
  buyerId: string
  buyerName: string
  buyerEmail: string | null
  installmentNumber: number
  dueDate: string
  expectedAmount: number
  paidAmount: number
  status: string
}

export function ScheduleReminder({
  buyerId,
  buyerName,
  buyerEmail,
  installmentNumber,
  dueDate,
  expectedAmount,
  paidAmount,
  status,
}: ScheduleReminderProps) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'paid' || !buyerEmail) return null

  const remaining = expectedAmount - paidAmount
  const isOverdue = status === 'overdue'

  const handleSend = async () => {
    setIsSending(true)
    setError(null)

    const message = isOverdue
      ? `Dear ${buyerName}, this is a reminder that installment #${installmentNumber} of ${formatCurrency(remaining)} was due on ${formatDate(dueDate)} and is now overdue. Please make your payment at your earliest convenience.`
      : `Dear ${buyerName}, this is a reminder that installment #${installmentNumber} of ${formatCurrency(remaining)} is due on ${formatDate(dueDate)}. Please ensure timely payment.`

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: buyerId,
          reminder_type: 'payment_due',
          message,
          sent_via: 'email',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

      setSent(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <Check className="w-3 h-3" /> Sent
      </span>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={isSending}
      title={error || `Send reminder for installment #${installmentNumber}`}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
        error
          ? 'text-red-600 bg-red-50 hover:bg-red-100'
          : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
      } disabled:opacity-50`}
    >
      <Mail className="w-3 h-3" />
      {isSending ? 'Sending...' : error ? 'Retry' : 'Remind'}
    </button>
  )
}
