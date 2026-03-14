import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  CalendarDays,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { BuyerActions } from '@/components/BuyerActions'
import { RecordPayment } from '@/components/RecordPayment'
import { ScheduleReminder } from '@/components/ScheduleReminder'

const statusColors: Record<string, string> = {
  fully_paid: 'bg-green-100 text-green-700',
  installment: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  fully_paid: 'Fully Paid',
  installment: 'Installment',
  overdue: 'Overdue',
}

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  pos: 'POS',
  online: 'Online',
}

export default async function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  const companyId = profile.company_id!

  const { data: buyerRaw } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (!buyerRaw) redirect('/dashboard/buyers')

  const buyer = buyerRaw as {
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    home_address: string | null
    plot_size: string | null
    plot_location: string | null
    plot_number: string | null
    purchase_date: string | null
    total_amount: number
    amount_paid: number
    next_payment_date: string | null
    payment_status: string
    documents: any
    notes: string | null
    created_at: string
    has_installment_plan: boolean | null
    plan_duration_months: number | null
    plan_start_date: string | null
    initial_deposit: number | null
  }

  const { data: paymentsRaw } = await supabase
    .from('payments')
    .select('*')
    .eq('buyer_id', id)
    .eq('company_id', companyId)
    .order('payment_date', { ascending: false })

  const payments = (paymentsRaw || []) as Array<{
    id: string
    amount: number
    payment_date: string
    payment_method: string
    reference: string | null
    notes: string | null
    recorded_by: string | null
    created_at: string
  }>

  // Fetch payment schedule if buyer has an installment plan
  let scheduleEntries: Array<{
    id: string
    installment_number: number
    due_date: string
    expected_amount: number
    paid_amount: number
    status: string
    payment_id: string | null
  }> = []
  let nextInstallment: typeof scheduleEntries[0] | null = null

  if (buyer.has_installment_plan) {
    const adminClient = createAdminClient()
    const { data: scheduleRaw } = await adminClient
      .from('payment_schedules')
      .select('*')
      .eq('buyer_id', id)
      .eq('company_id', companyId)
      .order('installment_number', { ascending: true })

    const today = new Date().toISOString().split('T')[0]
    scheduleEntries = ((scheduleRaw || []) as typeof scheduleEntries).map((entry) => {
      if ((entry.status === 'pending' || entry.status === 'partial') && entry.due_date < today) {
        return { ...entry, status: 'overdue' }
      }
      return entry
    })

    nextInstallment = scheduleEntries.find(
      (e) => e.status === 'pending' || e.status === 'partial' || e.status === 'overdue'
    ) || null
  }

  const outstanding = (buyer.total_amount || 0) - (buyer.amount_paid || 0)
  const paidPercentage = buyer.total_amount > 0
    ? Math.round((buyer.amount_paid / buyer.total_amount) * 100)
    : 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard/buyers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-gray-900">
              {buyer.first_name} {buyer.last_name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[buyer.payment_status] || statusColors.installment}`}>
              {statusLabels[buyer.payment_status] || 'Installment'}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Added {formatDate(buyer.created_at)}
          </p>
        </div>
        <BuyerActions buyerId={buyer.id} buyerName={`${buyer.first_name} ${buyer.last_name}`} />
      </div>

      {/* Financial Summary */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${buyer.has_installment_plan ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(buyer.total_amount || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(buyer.amount_paid || 0)}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(paidPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{paidPercentage}% paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Outstanding Balance</p>
            <p className={`text-2xl font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(Math.max(outstanding, 0))}
            </p>
          </CardContent>
        </Card>
        {buyer.has_installment_plan && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500 mb-1">Next Installment</p>
              {nextInstallment ? (
                <>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(nextInstallment.expected_amount - nextInstallment.paid_amount)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Due {formatDate(nextInstallment.due_date)} (#{nextInstallment.installment_number})
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-green-600">All Paid</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {buyer.email && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{buyer.email}</p>
                </div>
              </div>
            )}
            {buyer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{buyer.phone}</p>
                </div>
              </div>
            )}
            {buyer.home_address && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Home Address</p>
                  <p className="text-sm text-gray-900">{buyer.home_address}</p>
                </div>
              </div>
            )}
            {!buyer.email && !buyer.phone && !buyer.home_address && (
              <p className="text-sm text-gray-400">No contact information provided.</p>
            )}
          </CardContent>
        </Card>

        {/* Plot Info */}
        <Card>
          <CardHeader>
            <CardTitle>Plot Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {buyer.plot_location && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm text-gray-900">{buyer.plot_location}</p>
                </div>
              </div>
            )}
            {buyer.plot_number && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Plot Number</p>
                  <p className="text-sm text-gray-900">{buyer.plot_number}</p>
                </div>
              </div>
            )}
            {buyer.plot_size && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Plot Size</p>
                  <p className="text-sm text-gray-900">{buyer.plot_size}</p>
                </div>
              </div>
            )}
            {buyer.purchase_date && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Purchase Date</p>
                  <p className="text-sm text-gray-900">{formatDate(buyer.purchase_date)}</p>
                </div>
              </div>
            )}
            {buyer.next_payment_date && buyer.payment_status !== 'fully_paid' && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Next Payment Date</p>
                  <p className="text-sm text-gray-900">{formatDate(buyer.next_payment_date)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {buyer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{buyer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule */}
      {buyer.has_installment_plan && scheduleEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Payment Schedule
              <span className="text-sm font-normal text-gray-500">
                ({buyer.plan_duration_months} months)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-600">#</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Due Date</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Expected</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Paid</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduleEntries.map((entry) => {
                    const rowBg = entry.status === 'paid'
                      ? 'bg-green-50/50'
                      : entry.status === 'overdue'
                        ? 'bg-red-50/50'
                        : entry.status === 'partial'
                          ? 'bg-yellow-50/50'
                          : ''
                    const scheduleStatusColors: Record<string, string> = {
                      paid: 'bg-green-100 text-green-700',
                      partial: 'bg-yellow-100 text-yellow-700',
                      overdue: 'bg-red-100 text-red-700',
                      pending: 'bg-gray-100 text-gray-700',
                    }
                    const isNext = nextInstallment?.id === entry.id
                    return (
                      <tr key={entry.id} className={`${rowBg} ${isNext ? 'ring-2 ring-blue-200 ring-inset' : ''}`}>
                        <td className="py-3 px-3 text-gray-700">{entry.installment_number}</td>
                        <td className="py-3 px-3 text-gray-700">{formatDate(entry.due_date)}</td>
                        <td className="py-3 px-3 text-right font-medium text-gray-900">{formatCurrency(entry.expected_amount)}</td>
                        <td className="py-3 px-3 text-right font-medium text-gray-900">{formatCurrency(entry.paid_amount)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${scheduleStatusColors[entry.status] || scheduleStatusColors.pending}`}>
                            {entry.status === 'paid' ? 'Paid' : entry.status === 'partial' ? 'Partial' : entry.status === 'overdue' ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <ScheduleReminder
                            buyerId={buyer.id}
                            buyerName={`${buyer.first_name} ${buyer.last_name}`}
                            buyerEmail={buyer.email}
                            installmentNumber={entry.installment_number}
                            dueDate={entry.due_date}
                            expectedAmount={entry.expected_amount}
                            paidAmount={entry.paid_amount}
                            status={entry.status}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <RecordPayment
              buyerId={buyer.id}
              outstandingBalance={Math.max(outstanding, 0)}
              nextInstallment={nextInstallment ? {
                id: nextInstallment.id,
                installment_number: nextInstallment.installment_number,
                due_date: nextInstallment.due_date,
                expected_amount: nextInstallment.expected_amount,
                paid_amount: nextInstallment.paid_amount,
              } : undefined}
            />
          </div>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.payment_date)} via {methodLabels[payment.payment_method] || payment.payment_method}
                      </p>
                    </div>
                  </div>
                  {payment.reference && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Ref</p>
                      <p className="text-sm text-gray-600">{payment.reference}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No payments recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

