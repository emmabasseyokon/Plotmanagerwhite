'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateInstallmentSchedule } from '@/lib/schedule'
import { User, MapPin, CreditCard, Users, Share2, CheckCircle } from 'lucide-react'
import { PaymentProofUpload } from '@/components/PaymentProofUpload'

interface PlotSizeOption {
  size: string
  price: number
}

interface Estate {
  id: string
  name: string
  location: string
  price_per_plot: number
  plot_sizes: PlotSizeOption[]
}

interface Agent {
  id: string
  first_name: string
  last_name: string
}

interface PublicBuyerFormProps {
  companySlug: string
  companyName: string
  estates: Estate[]
  agents: Agent[]
}

const REFERRAL_OPTIONS = [
  'Instagram', 'Facebook', 'Twitter/X', 'TikTok',
  'Friend/Referral', 'Agent', 'Billboard', 'Google',
  'Newspaper/Magazine', 'Radio/TV', 'Other',
]

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
]

export function PublicBuyerForm({ companySlug, companyName, estates, agents }: PublicBuyerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [addAnother, setAddAnother] = useState(false)
  const [existingBuyer, setExistingBuyer] = useState<{
    id: string; first_name: string; last_name: string; plot_size: string | null;
    number_of_plots: number; total_amount: number; amount_paid: number;
    payment_status: string; purchase_date: string | null;
  } | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [homeAddress, setHomeAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [estateId, setEstateId] = useState('')
  const [numberOfPlots, setNumberOfPlots] = useState(1)
  const [plotSize, setPlotSize] = useState('')
  const [plotSizeQuantities, setPlotSizeQuantities] = useState<Record<string, number>>({})
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentType, setPaymentType] = useState<'outright' | 'installment'>('outright')
  const [installmentDuration, setInstallmentDuration] = useState(6)
  const [initialDeposit, setInitialDeposit] = useState(0)
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0])
  const [nokName, setNokName] = useState('')
  const [nokPhone, setNokPhone] = useState('')
  const [nokAddress, setNokAddress] = useState('')
  const [nokRelationship, setNokRelationship] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [agentId, setAgentId] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentProofUrl, setPaymentProofUrl] = useState('')

  const selectedEstate = estates.find((e) => e.id === estateId)
  const estateHasPlotSizes = selectedEstate && selectedEstate.plot_sizes && selectedEstate.plot_sizes.length > 0

  // Calculate total: sum of (quantity × price) for each selected plot size, or pricePerPlot × numberOfPlots for freeform
  const totalAmount = estateHasPlotSizes
    ? Object.entries(plotSizeQuantities).reduce((sum, [size, qty]) => {
        if (qty <= 0) return sum
        const match = selectedEstate.plot_sizes.find((ps) => ps.size === size)
        return sum + (match ? match.price * qty : 0)
      }, 0)
    : (selectedEstate?.price_per_plot || 0) * numberOfPlots
  const totalPlotCount = estateHasPlotSizes
    ? Object.values(plotSizeQuantities).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0)
    : numberOfPlots

  const schedule = paymentType === 'installment' && installmentDuration > 0 && totalAmount > 0
    ? generateInstallmentSchedule({
        total_amount: totalAmount,
        initial_deposit: initialDeposit,
        duration_months: installmentDuration,
        start_date: planStartDate,
      })
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      const res = await fetch(`/api/public/form/${companySlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          gender: gender || undefined,
          home_address: homeAddress || undefined,
          city: city || undefined,
          state: state || undefined,
          estate_id: estateId,
          number_of_plots: estateHasPlotSizes ? Math.max(1, totalPlotCount) : numberOfPlots,
          plot_size: estateHasPlotSizes
            ? Object.entries(plotSizeQuantities).filter(([, qty]) => qty > 0).map(([size, qty]) => `${qty}x ${size}`).join(', ') || undefined
            : plotSize || undefined,
          purchase_date: purchaseDate || undefined,
          payment_type: paymentType,
          installment_duration: paymentType === 'installment' ? installmentDuration : undefined,
          initial_deposit: paymentType === 'installment' ? initialDeposit : undefined,
          plan_start_date: paymentType === 'installment' ? planStartDate : undefined,
          next_of_kin_name: nokName || undefined,
          next_of_kin_phone: nokPhone || undefined,
          next_of_kin_address: nokAddress || undefined,
          next_of_kin_relationship: nokRelationship || undefined,
          referral_source: referralSource || undefined,
          agent_id: referralSource === 'Agent' && agentId ? agentId : undefined,
          notes: notes || undefined,
          payment_proof_url: paymentProofUrl || undefined,
          add_another: addAnother || undefined,
          existing_buyer_id: addAnother && existingBuyer ? existingBuyer.id : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'duplicate_buyer' && data.existingBuyer) {
          setExistingBuyer(data.existingBuyer)
          setError(null)
          setIsSubmitting(false)
          return
        }
        if (data.details) setFieldErrors(data.details)
        throw new Error(data.error || 'Submission failed')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Thank you for your registration. The <strong>{companyName}</strong> team will be in touch with you shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectClass = "flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {existingBuyer && !addAnother && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Existing Plot Found</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You already have a plot registered in this estate. Here are your details:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{existingBuyer.first_name} {existingBuyer.last_name}</span>
              </div>
              {existingBuyer.plot_size && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Plot Size</span>
                  <span className="font-medium text-gray-900">{existingBuyer.plot_size}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Number of Plots</span>
                <span className="font-medium text-gray-900">{existingBuyer.number_of_plots || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium text-gray-900">{formatCurrency(existingBuyer.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium text-gray-900">{formatCurrency(existingBuyer.amount_paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  existingBuyer.payment_status === 'fully_paid' ? 'bg-green-100 text-green-700' :
                  existingBuyer.payment_status === 'overdue' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {existingBuyer.payment_status?.replace('_', ' ')}
                </span>
              </div>
              {existingBuyer.purchase_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Date</span>
                  <span className="font-medium text-gray-900">{formatDate(existingBuyer.purchase_date)}</span>
                </div>
              )}
            </div>
            <Button
              type="button"
              className="w-full mt-4"
              onClick={() => {
                setAddAnother(true)
              }}
            >
              Add Another Plot
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Section 1: Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              error={fieldErrors.first_name?.[0]}
            />
            <Input
              label="Last Name *"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              error={fieldErrors.last_name?.[0]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={fieldErrors.email?.[0]}
            />
            <Input
              label="Phone Number *"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              error={fieldErrors.phone?.[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select className={selectClass} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Residential Address"
            placeholder="123 Main Street"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="Lagos"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <select className={selectClass} value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Land Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Land Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Estate *</label>
            <select
              className={selectClass}
              value={estateId}
              onChange={(e) => { setEstateId(e.target.value); setPlotSizeQuantities({}); setPlotSize('') }}
              required
            >
              <option value="">Choose an estate</option>
              {estates.map((estate) => (
                <option key={estate.id} value={estate.id}>
                  {estate.name} — {estate.location}
                </option>
              ))}
            </select>
            {fieldErrors.estate_id && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.estate_id[0]}</p>
            )}
          </div>

          {selectedEstate && (
            <>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-primary-600 font-medium">Estate</p>
                    <p className="text-gray-900 font-semibold">{selectedEstate.name}</p>
                  </div>
                  <div>
                    <p className="text-primary-600 font-medium">
                      {estateHasPlotSizes ? 'Select Plot Sizes' : 'Price per Plot'}
                    </p>
                    <p className="text-gray-900 font-semibold">
                      {estateHasPlotSizes
                        ? `${totalPlotCount} plot${totalPlotCount !== 1 ? 's' : ''} selected`
                        : formatCurrency(selectedEstate.price_per_plot || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {estateHasPlotSizes ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plot Sizes *</label>
                  <div className="space-y-2">
                    {selectedEstate.plot_sizes.map((ps) => {
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
                              onChange={() => {
                                setPlotSizeQuantities((prev) => ({
                                  ...prev,
                                  [ps.size]: isChecked ? 0 : 1,
                                }))
                              }}
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
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1)
                                  setPlotSizeQuantities((prev) => ({ ...prev, [ps.size]: val }))
                                }}
                                className="w-16 h-9 rounded-lg border-2 border-gray-200 bg-white px-2 text-center text-sm font-medium text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">plot{qty !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {totalPlotCount === 0 && fieldErrors.plot_size && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.plot_size[0]}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Plot Size"
                    placeholder="e.g. 600sqm"
                    value={plotSize}
                    onChange={(e) => setPlotSize(e.target.value)}
                  />
                  <Input
                    label="Number of Plots"
                    type="number"
                    min={1}
                    value={String(numberOfPlots)}
                    onChange={(e) => setNumberOfPlots(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Amount</label>
                  <div className="flex h-11 w-full items-center rounded-lg border-2 border-gray-200 bg-gray-50 px-4 text-base font-semibold text-gray-900">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
                <Input
                  label="Purchase Date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Payment Option */}
      {selectedEstate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Payment Option
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentType('outright')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  paymentType === 'outright'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-semibold ${paymentType === 'outright' ? 'text-green-700' : 'text-gray-900'}`}>
                  Outright Payment
                </p>
                <p className="text-sm text-gray-500 mt-1">Pay the full amount now</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('installment')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  paymentType === 'installment'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-semibold ${paymentType === 'installment' ? 'text-blue-700' : 'text-gray-900'}`}>
                  Installment Payment
                </p>
                <p className="text-sm text-gray-500 mt-1">Spread payments over time</p>
              </button>
            </div>

            {paymentType === 'outright' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
                Full payment of <strong>{formatCurrency(totalAmount)}</strong> is required.
              </div>
            )}

            {paymentType === 'installment' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {[3, 6, 12, 18, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setInstallmentDuration(m)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          installmentDuration === m
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {m} months
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Initial Deposit (optional)"
                    type="number"
                    placeholder="0"
                    min={0}
                    value={String(initialDeposit)}
                    onChange={(e) => setInitialDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <Input
                    label="Start Date"
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {schedule.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Payment Schedule Preview</p>
                    {initialDeposit > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-3">
                        Initial deposit: <strong>{formatCurrency(initialDeposit)}</strong> (paid upfront to secure your plot)
                      </div>
                    )}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Due Date</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {schedule.map((entry) => (
                            <tr key={entry.installment_number}>
                              <td className="py-2 px-3 text-gray-700">{entry.installment_number}</td>
                              <td className="py-2 px-3 text-gray-700">{formatDate(entry.due_date)}</td>
                              <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCurrency(entry.expected_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            <PaymentProofUpload
              value={paymentProofUrl}
              onChange={setPaymentProofUrl}
              uploadUrl="/api/public/upload"
              slug={companySlug}
            />
          </CardContent>
        </Card>
      )}

      {/* Section 4: Next of Kin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Next of Kin Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Next of Kin Name"
              placeholder="Jane Doe"
              value={nokName}
              onChange={(e) => setNokName(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="08012345678"
              value={nokPhone}
              onChange={(e) => setNokPhone(e.target.value)}
            />
          </div>
          <Input
            label="Address"
            placeholder="Next of kin address"
            value={nokAddress}
            onChange={(e) => setNokAddress(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
            <select className={selectClass} value={nokRelationship} onChange={(e) => setNokRelationship(e.target.value)}>
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

      {/* Section 5: Referral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" />
            Referral Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">How did you hear about us?</label>
            <select className={selectClass} value={referralSource} onChange={(e) => { setReferralSource(e.target.value); if (e.target.value !== 'Agent') setAgentId('') }}>
              <option value="">Select</option>
              {REFERRAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {referralSource === 'Agent' && agents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Agent</label>
              <select className={selectClass} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                <option value="">Select agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="pb-8">
        <Button
          type="submit"
          className="w-full py-3 text-base"
          isLoading={isSubmitting}
          disabled={!estateId}
        >
          Submit Registration
        </Button>
      </div>
    </form>
  )
}
