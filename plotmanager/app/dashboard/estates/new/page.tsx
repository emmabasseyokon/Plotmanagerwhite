'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { estateSchema, type EstateFormData, type PlotSizeEntry } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, X, ImageIcon, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function NewEstatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [plotSizes, setPlotSizes] = useState<PlotSizeEntry[]>([{ size: '', price: 0, is_default: true }])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EstateFormData>({
    resolver: zodResolver(estateSchema),
    defaultValues: {
      name: '',
      location: '',
      description: '',
      total_plots: 0,
      available_plots: 0,
      status: 'active',
      plot_sizes: [],
    },
  })

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
      // Filter out empty plot size entries
      const validPlotSizes = plotSizes.filter((ps) => ps.size.trim() !== '' && ps.price > 0)

      const res = await fetch('/api/estates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, plot_sizes: validPlotSizes, image_url: imageUrl || undefined }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to create estate')
      }

      router.push('/dashboard/estates')
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
        <Link href="/dashboard/estates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Add New Estate</h1>
          <p className="text-gray-500 mt-1">Enter the estate details below</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Total Plots *"
                type="number"
                placeholder="100"
                error={errors.total_plots?.message}
                {...register('total_plots', { valueAsNumber: true })}
              />
              <Input
                label="Available Plots *"
                type="number"
                placeholder="100"
                error={errors.available_plots?.message}
                {...register('available_plots', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plot Sizes & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Plot Sizes & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Add the available plot sizes and their prices. Check the box next to the default price shown on the landing page.
            </p>
            {plotSizes.map((ps, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex items-center justify-center mb-1">
                  <input
                    type="checkbox"
                    checked={ps.is_default || false}
                    onChange={() => {
                      const updated = plotSizes.map((p, i) => ({
                        ...p,
                        is_default: i === index ? !p.is_default : false,
                      }))
                      setPlotSizes(updated)
                    }}
                    title="Set as default price"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label={index === 0 ? 'Size' : undefined}
                    placeholder="e.g. 250sqm"
                    value={ps.size}
                    onChange={(e) => {
                      const updated = [...plotSizes]
                      updated[index] = { ...updated[index], size: e.target.value }
                      setPlotSizes(updated)
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label={index === 0 ? 'Price' : undefined}
                    type="number"
                    placeholder="e.g. 400000"
                    value={ps.price || ''}
                    onChange={(e) => {
                      const updated = [...plotSizes]
                      updated[index] = { ...updated[index], price: Number(e.target.value) || 0 }
                      setPlotSizes(updated)
                    }}
                  />
                </div>
                {plotSizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const wasDefault = plotSizes[index].is_default
                      const remaining = plotSizes.filter((_, i) => i !== index)
                      if (wasDefault && remaining.length > 0) {
                        remaining[0] = { ...remaining[0], is_default: true }
                      }
                      setPlotSizes(remaining)
                    }}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPlotSizes([...plotSizes, { size: '', price: 0, is_default: false }])}
              className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Plot Size
            </button>
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
          <Link href="/dashboard/estates">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting} disabled={isUploading}>
            Add Estate
          </Button>
        </div>
      </form>
    </div>
  )
}
