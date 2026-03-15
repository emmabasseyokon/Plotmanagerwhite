'use client'

import { useState, useEffect, useRef } from 'react'
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
import { ArrowLeft, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function EditEstatePage() {
  const router = useRouter()
  const params = useParams()
  const estateId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')

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
          if (data.estate.image_url) {
            setImagePreview(data.estate.image_url)
            setImageUrl(data.estate.image_url)
          }
        }
      })
      .catch(() => setServerError('Failed to load estate'))
      .finally(() => setIsLoading(false))
  }, [estateId, reset])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImagePreview(URL.createObjectURL(file))
    setIsUploading(true)
    setServerError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setImageUrl(data.url)
    } catch (err: any) {
      setServerError(err.message)
      setImagePreview(null)
      setImageUrl('')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: EstateFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch(`/api/estates/${estateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image_url: imageUrl || null }),
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
        {/* Estate Image */}
        <Card>
          <CardHeader>
            <CardTitle>Estate Image</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                <Image src={imagePreview} alt="Estate preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow hover:bg-white"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white text-sm font-medium">Uploading...</div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-sm text-gray-500">
                  <span className="text-primary-600 font-medium">Click to upload</span> an estate image
                </div>
                <p className="text-xs text-gray-400">JPEG, PNG, or WebP (max 5MB)</p>
              </button>
            )}
          </CardContent>
        </Card>

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
          <Button type="submit" isLoading={isSubmitting} disabled={isUploading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
