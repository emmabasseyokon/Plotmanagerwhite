'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

const ENTITY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'estate', label: 'Estate' },
  { value: 'agent', label: 'Agent' },
  { value: 'payment', label: 'Payment' },
  { value: 'commission', label: 'Commission' },
  { value: 'admin', label: 'Admin' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'settings', label: 'Settings' },
]

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
]

export function ActivityLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentEntityType = searchParams.get('entity_type') || 'all'
  const currentAction = searchParams.get('action') || 'all'
  const currentSearch = searchParams.get('search') || ''

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/dashboard/activity-logs?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            updateParams('search', formData.get('search') as string)
          }}
          className="flex-1"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="search"
              type="text"
              placeholder="Search by name or description..."
              defaultValue={currentSearch}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </form>
        <select
          value={currentEntityType}
          onChange={(e) => updateParams('entity_type', e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={currentAction}
          onChange={(e) => updateParams('action', e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
