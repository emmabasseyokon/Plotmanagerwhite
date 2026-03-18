import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/Card'
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { REFERRAL_OPTIONS } from '@/lib/constants'
import { ReferralCharts } from '@/components/analytics/ReferralCharts'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const companyId = profile.company_id!
  const adminClient = createAdminClient()

  const { data: buyersRaw } = await adminClient
    .from('buyers')
    .select('referral_source, total_amount, amount_paid, number_of_plots, payment_status')
    .eq('company_id', companyId)

  const buyers = (buyersRaw || []) as Array<{
    referral_source: string | null
    total_amount: number
    amount_paid: number
    number_of_plots: number | null
    payment_status: string
  }>

  // Group by referral source
  const sourceMap: Record<string, { buyers: number; plots: number; revenue: number; collected: number }> = {}

  for (const buyer of buyers) {
    const source = buyer.referral_source || 'Unknown'
    if (!sourceMap[source]) {
      sourceMap[source] = { buyers: 0, plots: 0, revenue: 0, collected: 0 }
    }
    sourceMap[source].buyers += 1
    sourceMap[source].plots += buyer.number_of_plots || 0
    sourceMap[source].revenue += buyer.total_amount || 0
    sourceMap[source].collected += buyer.amount_paid || 0
  }

  // Sort by REFERRAL_OPTIONS order, then any remaining
  const orderedSources = [
    ...REFERRAL_OPTIONS.filter(s => sourceMap[s]),
    ...Object.keys(sourceMap).filter(s => !REFERRAL_OPTIONS.includes(s)),
  ]

  const chartData = orderedSources.map(source => ({
    source,
    buyers: sourceMap[source].buyers,
    plots: sourceMap[source].plots,
    revenue: sourceMap[source].revenue,
  }))

  const tableData = orderedSources.map(source => {
    const d = sourceMap[source]
    return {
      source,
      ...d,
      avgDeal: d.buyers > 0 ? d.revenue / d.buyers : 0,
      pctRevenue: buyers.reduce((s, b) => s + (b.total_amount || 0), 0) > 0
        ? (d.revenue / buyers.reduce((s, b) => s + (b.total_amount || 0), 0)) * 100
        : 0,
    }
  })

  const totalSales = buyers.length
  const totalRevenue = buyers.reduce((s, b) => s + (b.total_amount || 0), 0)
  const totalPlots = buyers.reduce((s, b) => s + (b.number_of_plots || 0), 0)
  const avgDealSize = totalSales > 0 ? totalRevenue / totalSales : 0
  const topSource = orderedSources.length > 0
    ? orderedSources.reduce((top, s) => sourceMap[s].buyers > sourceMap[top].buyers ? s : top, orderedSources[0])
    : 'N/A'

  const stats = [
    { label: 'Total Sales', value: totalSales, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Avg. Deal Size', value: formatCurrency(avgDealSize), icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Top Source', value: topSource, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Sales Analytics</h1>
        <p className="text-gray-500 mt-1">Track sales performance by referral source</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Referral Source Performance</h2>
          <ReferralCharts data={chartData} formatCurrency={formatCurrency} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Breakdown by Source</h2>
          {tableData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-600">Source</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Buyers</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Plots Sold</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Collected</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">Avg. Deal</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tableData.map((row) => (
                    <tr key={row.source} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-900">{row.source}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{row.buyers}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{row.plots}</td>
                      <td className="py-3 px-3 text-right font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.collected)}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.avgDeal)}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{row.pctRevenue.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-3 px-3 font-bold text-gray-900">Total</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{totalSales}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{totalPlots}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(totalRevenue)}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(buyers.reduce((s, b) => s + (b.amount_paid || 0), 0))}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(avgDealSize)}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No sales data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
