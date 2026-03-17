'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALLOCATION_STATUS_COLORS, ALLOCATION_STATUS_LABELS } from '@/lib/constants'

interface AllocationToggleProps {
  buyerId: string
  currentStatus: string
}

export function AllocationToggle({ buyerId, currentStatus }: AllocationToggleProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async () => {
    const newStatus = status === 'allocated' ? 'not_allocated' : 'allocated'
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/buyers/${buyerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocation_status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setStatus(newStatus)
      router.refresh()
    } catch {
      setStatus(status) // Revert on failure
      alert('Failed to update allocation status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      title={`Click to mark as ${status === 'allocated' ? 'Not Allocated' : 'Allocated'}`}
      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity ${
        ALLOCATION_STATUS_COLORS[status] || ALLOCATION_STATUS_COLORS.not_allocated
      } ${isUpdating ? 'opacity-50' : 'hover:opacity-80'}`}
    >
      {ALLOCATION_STATUS_LABELS[status] || 'Not Allocated'}
    </button>
  )
}
