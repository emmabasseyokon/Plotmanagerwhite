export interface ScheduleEntry {
  installment_number: number
  due_date: string // YYYY-MM-DD
  expected_amount: number
}

export function generateInstallmentSchedule(params: {
  total_amount: number
  initial_deposit: number
  duration_months: number
  start_date: string // YYYY-MM-DD
}): ScheduleEntry[] {
  const { total_amount, initial_deposit, duration_months, start_date } = params
  const entries: ScheduleEntry[] = []
  const [year, month, day] = start_date.split('-').map(Number)

  // Initial deposit is a separate upfront payment to secure the plot.
  // The remaining balance is spread equally across all duration_months.
  const remaining = total_amount - initial_deposit
  const monthly = remaining > 0 ? Math.floor(remaining / duration_months) : 0
  const lastAmount = remaining > 0 ? remaining - monthly * (duration_months - 1) : 0

  for (let i = 0; i < duration_months; i++) {
    const date = new Date(year, month - 1 + i + 1, day)
    const dateStr = formatDate(date)

    entries.push({
      installment_number: i + 1,
      due_date: dateStr,
      expected_amount: i === duration_months - 1 ? lastAmount : monthly,
    })
  }

  return entries
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
