'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Settings, Check } from 'lucide-react'

interface ReminderSettingsProps {
  initialEnabled: boolean
  initialDays: number
}

export function ReminderSettings({ initialEnabled, initialDays }: ReminderSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [days, setDays] = useState(initialDays)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChanges = enabled !== initialEnabled || days !== initialDays

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/reminders/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_reminders_enabled: enabled,
          reminder_days_before: days,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Auto-Reminder Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-start gap-4 justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">Enable auto-reminders</p>
              <p className="text-sm text-gray-500">
                Automatically send email reminders before payment due dates
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                enabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Days before */}
          {enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days before due date
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      days === d
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {d} {d === 1 ? 'day' : 'days'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Buyers will receive an email reminder {days} {days === 1 ? 'day' : 'days'} before each installment is due.
              </p>
            </div>
          )}

          {/* Save button */}
          {hasChanges && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} isLoading={isSaving} size="sm">
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
