'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { BroadcastModal } from '@/components/BroadcastModal'
import { Send } from 'lucide-react'

interface BuyerPreview {
  id: string
  first_name: string
  last_name: string
  email: string | null
  estate_id: string | null
  payment_status: string
  allocation_status: string
}

interface ReminderActionsProps {
  estates: Array<{ id: string; name: string }>
  buyers: BuyerPreview[]
  canBroadcast: boolean
}

export function ReminderActions({ estates, buyers, canBroadcast }: ReminderActionsProps) {
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  if (!canBroadcast) return null

  return (
    <>
      <Button className="w-full sm:w-auto" onClick={() => setBroadcastOpen(true)}>
        <Send className="w-4 h-4 mr-2" />
        Send Broadcast
      </Button>
      <BroadcastModal
        estates={estates}
        buyers={buyers}
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
      />
    </>
  )
}
