'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Send } from 'lucide-react'

interface Estate {
  id: string
  name: string
}

interface BroadcastModalProps {
  estates: Estate[]
  isOpen: boolean
  onClose: () => void
}

export function BroadcastModal({ estates, isOpen, onClose }: BroadcastModalProps) {
  const router = useRouter()
  const [estateId, setEstateId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send broadcast')
      }

      setResult(data)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setEstateId('')
      setSubject('')
      setMessage('')
      setError(null)
      setResult(null)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Broadcast Email">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-3 text-sm border ${result.failed > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <p className="font-medium">
              {result.sent} of {result.total} emails sent successfully
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
            onChange={(e) => setEstateId(e.target.value)}
            required
          >
            <option value="">Select an estate</option>
            {estates.map((estate) => (
              <option key={estate.id} value={estate.id}>
                {estate.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Email will be sent to all buyers with email addresses in this estate.</p>
        </div>

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
