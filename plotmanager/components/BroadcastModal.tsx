'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Send } from 'lucide-react'
import { BUYER_STATUS_COLORS, BUYER_STATUS_LABELS, ALLOCATION_STATUS_COLORS, ALLOCATION_STATUS_LABELS } from '@/lib/constants'

interface Estate {
  id: string
  name: string
}

interface BuyerPreview {
  id: string
  first_name: string
  last_name: string
  email: string | null
  estate_id: string | null
  payment_status: string
  allocation_status: string
}

interface BroadcastModalProps {
  estates: Estate[]
  buyers: BuyerPreview[]
  isOpen: boolean
  onClose: () => void
}

export function BroadcastModal({ estates, buyers, isOpen, onClose }: BroadcastModalProps) {
  const router = useRouter()
  const [estateId, setEstateId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  const estateBuyers = useMemo(() => {
    if (!estateId) return []
    return buyers.filter((b) => b.estate_id === estateId)
  }, [estateId, buyers])

  const buyersWithEmail = useMemo(() => estateBuyers.filter((b) => b.email), [estateBuyers])

  const handleEstateChange = (newEstateId: string) => {
    setEstateId(newEstateId)
    // Auto-select all buyers with email in the new estate
    const emailBuyers = buyers.filter((b) => b.estate_id === newEstateId && b.email)
    setSelectedBuyerIds(new Set(emailBuyers.map((b) => b.id)))
  }

  const toggleBuyer = (buyerId: string) => {
    setSelectedBuyerIds((prev) => {
      const next = new Set(prev)
      if (next.has(buyerId)) next.delete(buyerId)
      else next.add(buyerId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedBuyerIds.size === buyersWithEmail.length) {
      setSelectedBuyerIds(new Set())
    } else {
      setSelectedBuyerIds(new Set(buyersWithEmail.map((b) => b.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/reminders/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estate_id: estateId,
          subject,
          message,
          buyer_ids: Array.from(selectedBuyerIds),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send broadcast')
      }

      setResult(data)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setEstateId('')
      setSubject('')
      setMessage('')
      setSelectedBuyerIds(new Set())
      setError(null)
      setResult(null)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Broadcast Message">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-3 text-sm border ${result.failed > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <p className="font-medium">
              {result.sent} of {result.total} messages sent successfully
              {result.failed > 0 && ` (${result.failed} failed)`}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Estate *
          </label>
          <select
            className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={estateId}
            onChange={(e) => handleEstateChange(e.target.value)}
            required
          >
            <option value="">Select an estate</option>
            {estates.map((estate) => (
              <option key={estate.id} value={estate.id}>
                {estate.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buyers in selected estate */}
        {estateId && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Buyers in this estate ({estateBuyers.length})
              </label>
              {buyersWithEmail.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  {selectedBuyerIds.size === buyersWithEmail.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            {estateBuyers.length > 0 ? (
              <div className="border-2 border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {estateBuyers.map((buyer) => {
                  const hasEmail = !!buyer.email
                  return (
                    <label
                      key={buyer.id}
                      className={`flex items-start gap-3 px-3 py-2 ${hasEmail ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBuyerIds.has(buyer.id)}
                        onChange={() => toggleBuyer(buyer.id)}
                        disabled={!hasEmail}
                        className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${hasEmail ? 'text-gray-900' : 'text-gray-400'}`}>
                          {buyer.first_name} {buyer.last_name}
                          {!hasEmail && <span className="text-xs ml-1">(no email)</span>}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BUYER_STATUS_COLORS[buyer.payment_status] || BUYER_STATUS_COLORS.installment}`}>
                            {BUYER_STATUS_LABELS[buyer.payment_status] || 'Installment'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ALLOCATION_STATUS_COLORS[buyer.allocation_status] || ALLOCATION_STATUS_COLORS.not_allocated}`}>
                            {ALLOCATION_STATUS_LABELS[buyer.allocation_status] || 'Not Allocated'}
                          </span>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No buyers in this estate.</p>
            )}
          </div>
        )}

        <Input
          label="Subject *"
          placeholder="e.g. Site Allocation Update"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Message *
          </label>
          <textarea
            className="flex w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[150px]"
            placeholder="Type your announcement message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button type="submit" isLoading={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              Send Broadcast
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
