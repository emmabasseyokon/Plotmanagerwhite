'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ReferralData {
  source: string
  buyers: number
  plots: number
  revenue: number
}

interface ReferralChartsProps {
  data: ReferralData[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16',
]

const CustomTooltip = ({ active, payload, label, isCurrency, formatCurrency }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-600">
        {isCurrency ? formatCurrency(payload[0].value) : payload[0].value}
      </p>
    </div>
  )
}

export function ReferralCharts({ data }: ReferralChartsProps) {
  if (data.length === 0) {
    return (
      <p className="text-gray-500 text-center py-12">No sales data yet.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-4">Plots Sold by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="source"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip isCurrency={false} formatCurrency={formatCurrency} />} />
            <Bar dataKey="plots" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-4">Revenue by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="source"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000000).toFixed(v >= 1000000 ? 1 : 0)}${v >= 1000000 ? 'M' : v >= 1000 ? 'K' : ''}`}
            />
            <Tooltip content={<CustomTooltip isCurrency={true} formatCurrency={formatCurrency} />} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
