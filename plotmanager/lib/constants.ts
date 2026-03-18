// Buyer payment status
export const BUYER_STATUS_COLORS: Record<string, string> = {
  fully_paid: 'bg-green-100 text-green-700',
  installment: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
}

export const BUYER_STATUS_LABELS: Record<string, string> = {
  fully_paid: 'Fully Paid',
  installment: 'Installment',
  overdue: 'Overdue',
}

// Allocation status
export const ALLOCATION_STATUS_COLORS: Record<string, string> = {
  allocated: 'bg-green-100 text-green-700',
  not_allocated: 'bg-gray-100 text-gray-600',
}

export const ALLOCATION_STATUS_LABELS: Record<string, string> = {
  allocated: 'Allocated',
  not_allocated: 'Not Allocated',
}

// Estate status
export const ESTATE_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  sold_out: 'bg-red-100 text-red-700',
  coming_soon: 'bg-amber-100 text-amber-700',
}

export const ESTATE_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  sold_out: 'Sold Out',
  coming_soon: 'Coming Soon',
}

// Schedule entry status
export const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  unpaid: 'bg-gray-100 text-gray-700',
}

export const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  unpaid: 'Unpaid',
}

// Payment methods
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  pos: 'POS',
  online: 'Online',
}

// Installment duration options (in months)
export const INSTALLMENT_DURATIONS = [3, 6, 12, 18, 24]

// Nigerian states
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nassarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

// Agent status
export const AGENT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
}

export const AGENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

// Commission status
export const COMMISSION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-red-100 text-red-700',
  unpaid: 'bg-red-100 text-red-700',
  partially_paid: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'Unpaid',
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
}

// Commission type labels
export const COMMISSION_TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage',
  flat: 'Flat Rate',
}

// Referral source options
export const REFERRAL_OPTIONS = [
  'Instagram', 'Facebook', 'Twitter/X', 'TikTok',
  'Friend/Referral', 'Agent', 'Billboard', 'Google',
  'Newspaper/Magazine', 'Radio/TV', 'Other',
]
