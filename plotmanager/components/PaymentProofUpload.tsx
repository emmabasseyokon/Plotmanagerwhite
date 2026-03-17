'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface PaymentProofUploadProps {
  value: string
  onChange: (url: string) => void
  uploadUrl?: string
  bucket?: string
  slug?: string
}

export function PaymentProofUpload({
  value,
  onChange,
  uploadUrl = '/api/upload',
  bucket = 'buyer-documents',
  slug,
}: PaymentProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (slug) {
        formData.append('slug', slug)
      } else {
        formData.append('bucket', bucket)
      }

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onChange(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Proof of Payment
      </label>

      {value ? (
        <div className="relative inline-block">
          <a href={value} target="_blank" rel="noopener noreferrer">
            <img
              src={value}
              alt="Payment proof"
              className="h-32 w-auto rounded-lg border-2 border-gray-200 object-cover hover:border-primary-500 transition-colors"
            />
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isUploading
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-4">
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-primary-600">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Click to upload screenshot</p>
                <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG or WebP (max 5MB)</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
