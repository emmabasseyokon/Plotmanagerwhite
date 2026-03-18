'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buyerSchema, type BuyerFormData } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, Plus } from 'lucide-react'
import { NIGERIAN_STATES, REFERRAL_OPTIONS } from '@/lib/constants'
import Link from 'next/link'
import { generateInstallmentSchedule } from '@/lib/schedule'
import { formatCurrency } from '@/lib/utils'
import { PaymentProofUpload } from '@/components/PaymentProofUpload'

interface PlotSizeOption {
  size: string
  price: number
}

interface Estate {
  id: string
  name: string
  location: string | null
  price_per_plot: number
  available_plots: number
  plot_sizes: PlotSizeOption[]
}

export default function EditBuyerPage() {
  const router = useRouter()
  const params = useParams()
  const buyerId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [estates, setEstates] = useState<Estate[]>([])
  const [currentEstateId, setCurrentEstateId] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'outright' | 'installment'>('outright')
  const [durationMonths, setDurationMonths] = useState(6)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [initialDeposit, setInitialDeposit] = useState(0)
  const [paymentProofUrl, setPaymentProofUrl] = useState('')
  const [plotSizeQuantities, setPlotSizeQuantities] = useState<Record<string, number>>({})
  const [agents, setAgents] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
  })

  const watchedTotalAmount = watch('total_amount') || 0

  const schedulePreview = paymentType === 'installment' && watchedTotalAmount > 0 && durationMonths > 0 && startDate
    ? generateInstallmentSchedule({
        total_amount: watchedTotalAmount,
        initial_deposit: initialDeposit,
        duration_months: durationMonths,
        start_date: startDate,
      })
    : []

  useEffect(() => {
    Promise.all([
      fetch(`/api/buyers/${buyerId}`).then((r) => r.json()),
      fetch('/api/estates').then((r) => r.json()),
      fetch('/api/agents?status=active').then((r) => r.json()),
    ])
      .then(([buyerData, estatesData, agentsData]) => {
        setEstates(estatesData.estates || [])
        setAgents(agentsData.agents || [])
        if (buyerData.buyer) {
          const b = buyerData.buyer
          setCurrentEstateId(b.estate_id || '')
          // Restore payment type state
          if (b.has_installment_plan) {
            setPaymentType('installment')
            setDurationMonths(b.plan_duration_months || 6)
            setStartDate(b.plan_start_date || new Date().toISOString().split('T')[0])
            setInitialDeposit(b.initial_deposit || 0)
          } else if (b.payment_status === 'fully_paid') {
            setPaymentType('outright')
          }
          setPaymentProofUrl(b.payment_proof_url || '')
          // Restore plot size quantities from stored string (e.g. "2x 250sqm, 3x 600sqm" or "250sqm, 600sqm")
          if (b.plot_size) {
            const entries = b.plot_size.split(',').map((s: string) => s.trim()).filter(Boolean)
            const quantities: Record<string, number> = {}
            for (const entry of entries) {
              const match = entry.match(/^(\d+)x\s+(.+)$/)
              if (match) {
                quantities[match[2]] = parseInt(match[1])
              } else {
                quantities[entry] = 1
              }
            }
            setPlotSizeQuantities(quantities)
          }
          reset({
            first_name: b.first_name || '',
            last_name: b.last_name || '',
            email: b.email || '',
            phone: b.phone || '',
            gender: b.gender || '',
            home_address: b.home_address || '',
            city: b.city || '',
            state: b.state || '',
            plot_size: b.plot_size || '',
            plot_location: b.plot_location || '',
            plot_number: b.plot_number || '',
            number_of_plots: b.number_of_plots || 1,
            purchase_date: b.purchase_date || '',
            total_amount: b.total_amount || 0,
            amount_paid: b.amount_paid || 0,
            next_payment_date: b.next_payment_date || '',
            payment_status: b.payment_status || 'installment',
            next_of_kin_name: b.next_of_kin_name || '',
            next_of_kin_phone: b.next_of_kin_phone || '',
            next_of_kin_address: b.next_of_kin_address || '',
            next_of_kin_relationship: b.next_of_kin_relationship || '',
            agent_id: b.agent_id || '',
            referral_source: b.agent_id ? 'Agent' : (b.referral_source || ''),
            notes: b.notes || '',
            estate_id: b.estate_id || '',
          })
        }
      })
      .catch(() => setServerError('Failed to load buyer'))
      .finally(() => setIsLoading(false))
  }, [buyerId, reset])

  const selectedEstate = estates.find((e) => e.id === currentEstateId)
  const estateHasPlotSizes = selectedEstate && selectedEstate.plot_sizes && selectedEstate.plot_sizes.length > 0

  const handleEstateChange = (estateId: string) => {
    setCurrentEstateId(estateId)
    setValue('estate_id', estateId)
    setValue('plot_size', '')
    setPlotSizeQuantities({})
    if (estateId) {
      const estate = estates.find((e) => e.id === estateId)
      if (estate) {
        setValue('plot_location', estate.location || estate.name)
        if (!estate.plot_sizes || estate.plot_sizes.length === 0) {
          setValue('total_amount', estate.price_per_plot || 0)
        } else {
          setValue('total_amount', 0)
        }
      }
    }
  }

  const handlePlotSizeToggle = (size: string, quantity?: number) => {
    const updated = { ...plotSizeQuantities }
    if (quantity !== undefined) {
      updated[size] = quantity
    } else {
      updated[size] = updated[size] > 0 ? 0 : 1
    }
    setPlotSizeQuantities(updated)
    const plotSizeStr = Object.entries(updated).filter(([, qty]) => qty > 0).map(([s, qty]) => `${qty}x ${s}`).join(', ')
    const totalCount = Object.values(updated).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0)
    setValue('plot_size', plotSizeStr)
    setValue('number_of_plots', Math.max(1, totalCount))
    if (selectedEstate) {
      const total = Object.entries(updated).reduce((sum, [s, qty]) => {
        if (qty <= 0) return sum
        const match = selectedEstate.plot_sizes.find((ps) => ps.size === s)
        return sum + (match ? match.price * qty : 0)
      }, 0)
      setValue('total_amount', total)
    }
  }

  const onSubmit = async (data: BuyerFormData) => {
    setIsSubmitting(true)
    setServerError(null)

    try {
      const payload: Record<string, unknown> = { ...data }
      if (!payload.estate_id) delete payload.estate_id
      payload.payment_proof_url = paymentProofUrl || ''

      // Set payment fields based on payment type
      if (paymentType === 'outright') {
        payload.amount_paid = payload.total_amount
        payload.payment_status = 'fully_paid'
        payload.installment_plan = { enabled: false }
      } else {
        if (durationMonths > 0 && startDate) {
          payload.installment_plan = {
            enabled: true,
            duration_months: durationMonths,
            start_date: startDate,
            initial_deposit: initialDeposit,
          }
        }
      }

      const res = await fetch(`/api/buyers/${buyerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to update buyer')
      }

      router.push(`/dashboard/buyers/${buyerId}`)
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
        <Link href={`/dashboard/buyers/${buyerId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Edit Buyer</h1>
          <p className="text-gray-500 mt-1">Update buyer information</p>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
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
                label="Phone"
                placeholder="08012345678"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
              <select
                className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                {...register('gender')}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Home Address"
              placeholder="123 Main Street, Lagos"
              error={errors.home_address?.message}
              {...register('home_address')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="Lagos"
                {...register('city')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  {...register('state')}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plot Information */}
        <Card>
          <CardHeader>
            <CardTitle>Plot Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {estates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Estate
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={currentEstateId}
                  onChange={(e) => handleEstateChange(e.target.value)}
                >
                  <option value="">-- No estate (manual entry) --</option>
                  {estates.map((estate) => (
                    <option key={estate.id} value={estate.id}>
                      {estate.name}{estate.location ? ` - ${estate.location}` : ''} ({estate.available_plots} plots available)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecting an estate will prefill the location and total amount
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Plot Location"
                placeholder="Lekki Phase 2"
                error={errors.plot_location?.message}
                {...register('plot_location')}
              />
              <Input
                label="Plot Number"
                placeholder="A-001"
                error={errors.plot_number?.message}
                {...register('plot_number')}
              />
            </div>
            {estateHasPlotSizes ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plot Sizes</label>
                <div className="space-y-2">
                  {selectedEstate!.plot_sizes.map((ps) => {
                    const qty = plotSizeQuantities[ps.size] || 0
                    const isChecked = qty > 0
                    return (
                      <div
                        key={ps.size}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          isChecked
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePlotSizeToggle(ps.size)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                          />
                          <span className="font-medium text-gray-900">{ps.size}</span>
                          <span className="text-sm text-gray-500">({formatCurrency(ps.price)} each)</span>
                        </label>
                        {isChecked && (
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            <input
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(e) => handlePlotSizeToggle(ps.size, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 h-9 rounded-lg border-2 border-gray-200 bg-white px-2 text-center text-sm font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">plot{qty !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Plot Size"
                  placeholder="500sqm"
                  error={errors.plot_size?.message}
                  {...register('plot_size')}
                />
                <Input
                  label="Number of Plots"
                  type="number"
                  min={1}
                  error={errors.number_of_plots?.message}
                  {...register('number_of_plots', { valueAsNumber: true })}
                />
              </div>
            )}
            <Input
              label="Purchase Date"
              type="date"
              error={errors.purchase_date?.message}
              {...register('purchase_date')}
            />

            {/* Add Another Plot */}
            <div className="pt-4 border-t border-gray-100">
              <Link
                href={`/dashboard/buyers/new?from=${buyerId}&estate_id=${currentEstateId}`}
              >
                <Button type="button" variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Plot
                </Button>
              </Link>
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                Creates a new plot purchase linked to this buyer&apos;s email
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Type */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Total Amount *"
              type="number"
              placeholder="5000000"
              error={errors.total_amount?.message}
              {...register('total_amount', { valueAsNumber: true })}
              readOnly={!!estateHasPlotSizes && !!watch('plot_size')}
            />

            {/* Payment mode selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Payment Type</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    paymentType === 'outright'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_type"
                    checked={paymentType === 'outright'}
                    onChange={() => setPaymentType('outright')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Outright Payment</p>
                    <p className="text-xs text-gray-500">Buyer paid in full</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    paymentType === 'installment'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_type"
                    checked={paymentType === 'installment'}
                    onChange={() => setPaymentType('installment')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Installment Payment</p>
                    <p className="text-xs text-gray-500">Buyer pays over time</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Outright confirmation */}
            {paymentType === 'outright' && watchedTotalAmount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                Buyer will be marked as <span className="font-semibold">Fully Paid</span> with {formatCurrency(watchedTotalAmount)} recorded.
              </div>
            )}

            {/* Installment plan fields */}
            {paymentType === 'installment' && (
              <div className="space-y-4 pt-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Changing plan parameters will only regenerate unpaid installments. Already paid entries are preserved.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                    <select
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(Number(e.target.value))}
                      className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                      <option value={18}>18 months</option>
                      <option value={24}>24 months</option>
                    </select>
                  </div>
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    label="Initial Deposit"
                    type="number"
                    placeholder="0"
                    value={initialDeposit || ''}
                    onChange={(e) => setInitialDeposit(Number(e.target.value) || 0)}
                  />
                </div>

                {schedulePreview.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule Preview</h4>
                    {initialDeposit > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex justify-between items-center text-sm">
                        <span className="font-medium text-blue-800">Initial Deposit (upfront)</span>
                        <span className="font-bold text-blue-900">{formatCurrency(initialDeposit)}</span>
                      </div>
                    )}
                    <div className="border-2 border-gray-100 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Due Date</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {schedulePreview.map((entry) => (
                            <tr key={entry.installment_number}>
                              <td className="py-2 px-3 text-gray-700">{entry.installment_number}</td>
                              <td className="py-2 px-3 text-gray-700">
                                {new Date(entry.due_date + 'T00:00:00').toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-gray-900">
                                {formatCurrency(entry.expected_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="py-2 px-3 font-medium text-gray-700">Total</td>
                            <td className="py-2 px-3 text-right font-bold text-gray-900">
                              {formatCurrency(initialDeposit + schedulePreview.reduce((sum, e) => sum + e.expected_amount, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <PaymentProofUpload
              value={paymentProofUrl}
              onChange={setPaymentProofUrl}
            />
          </CardContent>
        </Card>

        {/* Next of Kin */}
        <Card>
          <CardHeader>
            <CardTitle>Next of Kin Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Next of Kin Name"
                placeholder="Jane Doe"
                {...register('next_of_kin_name')}
              />
              <Input
                label="Phone Number"
                placeholder="08012345678"
                {...register('next_of_kin_phone')}
              />
            </div>
            <Input
              label="Address"
              placeholder="Next of kin address"
              {...register('next_of_kin_address')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
              <select
                className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                {...register('next_of_kin_relationship')}
              >
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Referral */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">How did they hear about us?</label>
              <select
                className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                {...register('referral_source')}
                onChange={(e) => { setValue('referral_source', e.target.value); if (e.target.value !== 'Agent') setValue('agent_id', '') }}
              >
                <option value="">Select</option>
                {REFERRAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {watch('referral_source') === 'Agent' && agents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Agent</label>
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  {...register('agent_id')}
                >
                  <option value="">Select agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Commission will be auto-calculated based on agent settings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any additional notes about this buyer..."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/buyers/${buyerId}`}>
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
