'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Loader2 } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function setup() {
      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to set up account')
        }

        showToast('Account set up successfully!', 'success')
        router.push('/dashboard')
        router.refresh()
      } catch (err: any) {
        setError(err.message)
      }
    }

    setup()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="text-center space-y-6 animate-slide-up">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        {error ? (
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Setup Failed</h1>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        ) : (
          <div>
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-gray-900">Setting up your account...</h1>
            <p className="text-gray-500 mt-2">This will only take a moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
