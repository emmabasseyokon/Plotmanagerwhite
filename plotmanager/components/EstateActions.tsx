'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Pencil, Trash2 } from 'lucide-react'

export function EstateActions({ estateId, estateName }: { estateId: string; estateName: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${estateName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/estates/${estateId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete estate')
      }
      router.push('/dashboard/estates')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/estates/${estateId}/edit`)}>
        <Pencil className="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        onClick={handleDelete}
        isLoading={isDeleting}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  )
}
