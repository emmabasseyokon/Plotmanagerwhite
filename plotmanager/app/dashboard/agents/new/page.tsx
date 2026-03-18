'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { agentSchema, type AgentFormData } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewAgentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      commission_type: 'percentage',
      commission_rate: 0,
      status: 'active',
      notes: '',
    },
  })

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to create agent')
      }

      router.push('/dashboard/agents')
      router.refresh()
    } catch (err: any) {
      setServerError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Add New Agent</h1>
          <p className="text-gray-500 mt-1">Enter the agent&apos;s information below</p>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Agent Details */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                placeholder="John"
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label="Last Name *"
                placeholder="Doe"
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone *"
                placeholder="08012345678"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Name"
                placeholder="First Bank"
                error={errors.bank_name?.message}
                {...register('bank_name')}
              />
              <Input
                label="Account Number"
                placeholder="0123456789"
                error={errors.bank_account_number?.message}
                {...register('bank_account_number')}
              />
            </div>
            <Input
              label="Account Name"
              placeholder="John Doe"
              error={errors.bank_account_name?.message}
              {...register('bank_account_name')}
            />
          </CardContent>
        </Card>

        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Type</label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  {...register('commission_type')}
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat Rate</option>
                </select>
              </div>
              <Input
                label="Commission Rate *"
                type="number"
                placeholder="0"
                error={errors.commission_rate?.message}
                {...register('commission_rate', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this agent..."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/agents">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            Add Agent
          </Button>
        </div>
      </form>
    </div>
  )
}
