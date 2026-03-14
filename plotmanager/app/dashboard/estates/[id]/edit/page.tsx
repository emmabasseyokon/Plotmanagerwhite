'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { estateSchema, type EstateFormData } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditEstatePage() {
  const router = useRouter()
  const params = useParams()
  const estateId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EstateFormData>({
    resolver: zodResolver(estateSchema),
  })

  useEffect(() => {
    fetch(`/api/estates/${estateId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.estate) {
          reset({
            name: data.estate.name || '',
            location: data.estate.location || '',
            description: data.estate.description || '',
            total_plots: data.estate.total_plots || 0,
            available_plots: data.estate.available_plots || 0,
            price_per_plot: data.estate.price_per_plot || 0,
            status: data.estate.status || 'active',
          })
        }
      })
      .catch(() => setServerError('Failed to load estate'))
      .finally(() => setIsLoading(false))
  }, [estateId, reset])

  const onSubmit = async (data: EstateFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch(`/api/estates/${estateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to update estate')
      }

      router.push(`/dashboard/estates/${estateId}`)
      router.refresh()
    } catch (err: any) {
      setServerError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/estates/${estateId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Edit Estate</h1>
          <p className="text-gray-500 mt-1">Update estate details</p>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Estate Details */}
        <Card>
          <CardHeader>
            <CardTitle>Estate Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Estate Name *"
              placeholder="Lekki Gardens Phase 2"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Location"
              placeholder="Lekki, Lagos"
              error={errors.location?.message}
              {...register('location')}
            />
            <Textarea
              label="Description"
              placeholder="A brief description of the estate..."
              error={errors.description?.message}
              {...register('description')}
            />
          </CardContent>
        </Card>

        {/* Plot Information */}
        <Card>
          <CardHeader>
            <CardTitle>Plot Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Total Plots *"
                type="number"
                error={errors.total_plots?.message}
                {...register('total_plots', { valueAsNumber: true })}
              />
              <Input
                label="Available Plots *"
                type="number"
                error={errors.available_plots?.message}
                {...register('available_plots', { valueAsNumber: true })}
              />
              <Input
                label="Price per Plot *"
                type="number"
                error={errors.price_per_plot?.message}
                {...register('price_per_plot', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Estate Status"
              error={errors.status?.message}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'coming_soon', label: 'Coming Soon' },
                { value: 'sold_out', label: 'Sold Out' },
              ]}
              {...register('status')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/estates/${estateId}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
