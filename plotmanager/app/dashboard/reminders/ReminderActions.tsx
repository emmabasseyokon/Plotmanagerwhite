'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { BroadcastModal } from '@/components/BroadcastModal'
import { Send } from 'lucide-react'

interface ReminderActionsProps {
  estates: Array<{ id: string; name: string }>
  canBroadcast: boolean
}

export function ReminderActions({ estates, canBroadcast }: ReminderActionsProps) {
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  if (!canBroadcast) return null

  return (
    <>
      <Button onClick={() => setBroadcastOpen(true)}>
        <Send className="w-4 h-4 mr-2" />
        Send Broadcast
      </Button>
      <BroadcastModal
        estates={estates}
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
      />
    </>
  )
}
