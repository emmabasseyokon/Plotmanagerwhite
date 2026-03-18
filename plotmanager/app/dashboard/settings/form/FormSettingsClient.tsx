'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Check, Copy, ExternalLink, FileText, Code } from 'lucide-react'

interface FormSettingsClientProps {
  formEnabled: boolean
  formUrl: string
  slug: string
}

export function FormSettingsClient({ formEnabled: initialEnabled, formUrl, slug }: FormSettingsClientProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const embedCode = `<iframe src="${formUrl}" width="100%" height="800" frameborder="0" style="border: none; border-radius: 12px;"></iframe>`

  const handleToggle = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_enabled: !enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEnabled(!enabled)
      router.refresh()
    } catch {
      // revert on error
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'url' | 'embed') => {
    await navigator.clipboard.writeText(text)
    if (type === 'url') {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } else {
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toggle Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Public Registration Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {enabled ? 'Form is live' : 'Form is disabled'}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {enabled
                  ? 'Buyers can access your registration form via the link below.'
                  : 'Enable to allow buyers to register through a public form.'}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                enabled ? 'bg-primary-600' : 'bg-gray-300'
              } ${saving ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Form URL */}
      {enabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">
                Share this link with potential buyers or add it to your website.
              </p>
              <div className="space-y-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-mono break-all">
                  {formUrl}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formUrl, 'url')}
                    className="flex-1 sm:flex-none"
                  >
                    {copiedUrl ? (
                      <><Check className="w-4 h-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-1" /> Copy Link</>
                    )}
                  </Button>
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code className="w-5 h-5 text-gray-400" />
                Embed on Your Website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">
                Add this code to your website (WordPress, Elementor, or any HTML page) to embed the registration form directly.
              </p>
              <div className="space-y-2">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode, 'embed')}
                  className="w-full sm:w-auto"
                >
                  {copiedEmbed ? (
                    <><Check className="w-4 h-4 mr-1" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-1" /> Copy Embed Code</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Share the form link or embed it on your website (e.g., Elementor page, WhatsApp, social media).</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Buyers fill in their personal details, select an estate, and choose a payment plan.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>A new buyer record is automatically created in your PlotManager dashboard — no manual data entry needed.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>If they chose installment, a payment schedule is automatically generated for them.</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
