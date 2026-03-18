'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COMMISSION_STATUS_COLORS, COMMISSION_STATUS_LABELS } from '@/lib/constants'

interface CommissionStatusToggleProps {
  commissionId: string
  currentStatus: string
}

export function CommissionStatusToggle({ commissionId, currentStatus }: CommissionStatusToggleProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const displayStatus = status === 'pending' || status === 'unpaid' ? 'unpaid' : status

  const handleToggle = async () => {
    const newStatus = displayStatus === 'paid' ? 'unpaid' : 'paid'
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/commissions/${commissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setStatus(newStatus)
      router.refresh()
    } catch {
      setStatus(status)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      title={`Click to mark as ${displayStatus === 'paid' ? 'Unpaid' : 'Paid'}`}
      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity ${
        COMMISSION_STATUS_COLORS[displayStatus] || COMMISSION_STATUS_COLORS.unpaid
      } ${isUpdating ? 'opacity-50' : 'hover:opacity-80'}`}
    >
      {COMMISSION_STATUS_LABELS[displayStatus] || 'Unpaid'}
    </button>
  )
}
