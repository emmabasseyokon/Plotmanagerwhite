'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Mail } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SendReminderProps {
  buyerId: string
  buyerName: string
  buyerEmail: string | null
  paymentStatus: string
  outstandingBalance: number
  nextPaymentDate: string | null
}

export function SendReminder({
  buyerId,
  buyerName,
  buyerEmail,
  paymentStatus,
  outstandingBalance,
  nextPaymentDate,
}: SendReminderProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isFullyPaid = paymentStatus === 'fully_paid'
  const isOverdue = paymentStatus === 'overdue'
  const defaultMessage = isFullyPaid
    ? `Dear ${buyerName},`
    : isOverdue
      ? `Dear ${buyerName}, this is a reminder that your payment of ${formatCurrency(outstandingBalance)} was due on ${nextPaymentDate ? formatDate(nextPaymentDate) : 'a previous date'} and is now overdue. Please make your payment at your earliest convenience.`
      : `Dear ${buyerName}, this is a reminder that your upcoming payment of ${formatCurrency(outstandingBalance)} is due on ${nextPaymentDate ? formatDate(nextPaymentDate) : 'your next payment date'}. Please ensure timely payment.`

  const [message, setMessage] = useState(defaultMessage)

  const handleOpen = () => {
    setMessage(defaultMessage)
    setError(null)
    setSuccess(false)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: buyerId,
          reminder_type: isFullyPaid ? 'custom' : 'payment_due',
          message,
          sent_via: 'email',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reminder')
      }

      if (!data.emailSent) {
        setError(data.emailError || 'Email could not be delivered, but reminder was recorded.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const disabled = !buyerEmail

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        disabled={disabled}
        title={
          !buyerEmail
            ? 'Buyer has no email address'
            : 'Send message to buyer'
        }
      >
        <Mail className="w-4 h-4 mr-2" />
        Send Message
      </Button>

      <Modal isOpen={isOpen} onClose={() => !isSubmitting && setIsOpen(false)} title="Send Message">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              Message sent successfully to {buyerEmail}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">Sending to: {buyerEmail}</p>
            {!isFullyPaid && <p>Outstanding: {formatCurrency(outstandingBalance)}</p>}
            {!isFullyPaid && nextPaymentDate && <p>Due date: {formatDate(nextPaymentDate)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              className="flex w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">You can edit the message before sending.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={success}>
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
