import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})


export const adminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'super_admin']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const installmentPlanSchema = z.object({
  enabled: z.boolean().default(false),
  duration_months: z.number().int().min(1).max(60).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  initial_deposit: z.number().min(0).optional(),
})

export const buyerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email').max(254).optional().or(z.literal('')),
  phone: z.string().regex(/^(\+?[0-9]{7,15}|0[0-9]{10})$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  home_address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  plot_size: z.string().max(500).optional(),
  plot_location: z.string().max(200).optional(),
  plot_number: z.string().max(100).optional(),
  number_of_plots: z.number().int().min(1).max(100).optional(),
  purchase_date: z.string().optional(),
  total_amount: z.number().min(0, 'Amount must be 0 or greater').max(100_000_000_000),
  amount_paid: z.number().min(0, 'Amount must be 0 or greater').max(100_000_000_000),
  next_payment_date: z.string().optional(),
  payment_status: z.enum(['fully_paid', 'installment', 'overdue']).default('installment'),
  allocation_status: z.enum(['allocated', 'not_allocated']).default('not_allocated').optional(),
  next_of_kin_name: z.string().max(200).optional(),
  next_of_kin_phone: z.string().max(20).optional(),
  next_of_kin_address: z.string().max(500).optional(),
  next_of_kin_relationship: z.string().max(100).optional(),
  agent_id: z.string().uuid().optional().or(z.literal('')),
  referral_source: z.string().max(100).optional(),
  referral_phone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
  estate_id: z.string().uuid().optional().or(z.literal('')),
  payment_proof_url: z.string().url().max(2048).optional().or(z.literal('')),
  installment_plan: installmentPlanSchema.optional(),
})

export const plotSizeEntrySchema = z.object({
  size: z.string().min(1, 'Size is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  is_default: z.boolean().optional().default(false),
})

export const estateSchema = z.object({
  name: z.string().min(2, 'Estate name must be at least 2 characters').max(200),
  location: z.string().max(500).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  total_plots: z.number().int().min(0, 'Must be 0 or greater').max(100_000),
  available_plots: z.number().int().min(0, 'Must be 0 or greater').max(100_000),
  price_per_plot: z.number().min(0, 'Must be 0 or greater').max(100_000_000_000).optional(),
  plot_sizes: z.array(plotSizeEntrySchema).max(50).optional().default([]),
  status: z.enum(['active', 'sold_out', 'coming_soon']).default('active'),
  image_url: z.string().url().max(2048).optional().or(z.literal('')).or(z.literal(undefined)),
})

export const createAdminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const paymentScheduleSchema = z.object({
  buyer_id: z.string().uuid(),
  installment_number: z.number().int().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expected_amount: z.number().positive(),
  paid_amount: z.number().min(0).default(0),
  status: z.enum(['unpaid', 'paid', 'partial', 'overdue']).default('unpaid'),
  payment_id: z.string().uuid().nullable().optional(),
})

export const paymentSchema = z.object({
  buyer_id: z.string().uuid('Invalid buyer'),
  amount: z.number().positive('Amount must be greater than 0'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  payment_method: z.enum(['cash', 'bank_transfer', 'pos', 'online']),
  reference: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  schedule_entry_id: z.string().uuid().optional(),
})

export const reminderSchema = z.object({
  buyer_id: z.string().uuid('Invalid buyer'),
  reminder_type: z.enum(['payment_due', 'custom']),
  message: z.string().min(1, 'Message is required').max(1024),
  sent_via: z.enum(['email', 'whatsapp']),
})

export const broadcastSchema = z.object({
  estate_id: z.string().uuid('Invalid estate'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
  buyer_ids: z.array(z.string().uuid()).min(1, 'Select at least one buyer'),
})

export type BroadcastFormData = z.infer<typeof broadcastSchema>

export type LoginFormData = z.infer<typeof loginSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type AdminFormData = z.infer<typeof adminSchema>
export type BuyerFormData = z.infer<typeof buyerSchema>
export type EstateFormData = z.infer<typeof estateSchema>
export type PlotSizeEntry = z.infer<typeof plotSizeEntrySchema>
export type CreateAdminFormData = z.infer<typeof createAdminSchema>
export type InstallmentPlanData = z.infer<typeof installmentPlanSchema>
export type PaymentScheduleData = z.infer<typeof paymentScheduleSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type ReminderFormData = z.infer<typeof reminderSchema>

export const publicBuyerFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email').max(254),
  phone: z.string().regex(/^(\+?[0-9]{7,15}|0[0-9]{10})$/, 'Please enter a valid phone number'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  home_address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  estate_id: z.string().uuid('Please select an estate'),
  number_of_plots: z.number().int().min(1).max(100).default(1),
  plot_size: z.string().max(500).optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').optional(),
  payment_type: z.enum(['outright', 'installment']),
  installment_duration: z.number().int().min(1).max(60).optional(),
  initial_deposit: z.number().min(0).max(100_000_000_000).optional(),
  plan_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').optional(),
  next_of_kin_name: z.string().max(200).optional(),
  next_of_kin_phone: z.string().max(20).optional(),
  next_of_kin_address: z.string().max(500).optional(),
  next_of_kin_relationship: z.string().max(100).optional(),
  referral_source: z.string().max(100).optional(),
  agent_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
  payment_proof_url: z.string().url().max(2048).optional().or(z.literal('')),
  add_another: z.boolean().optional(),
  existing_buyer_id: z.string().uuid().optional(),
})

export type PublicBuyerFormData = z.infer<typeof publicBuyerFormSchema>

export const agentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email').max(254).optional().or(z.literal('')),
  phone: z.string().regex(/^(\+?[0-9]{7,15}|0[0-9]{10})$/, 'Please enter a valid phone number'),
  bank_name: z.string().max(200).optional().or(z.literal('')),
  bank_account_number: z.string().max(20).optional().or(z.literal('')),
  bank_account_name: z.string().max(200).optional().or(z.literal('')),
  commission_type: z.enum(['percentage', 'flat']).default('percentage'),
  commission_rate: z.number().min(0, 'Must be 0 or greater').max(100_000_000, 'Rate is too high'),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type AgentFormData = z.infer<typeof agentSchema>

export const commissionPaymentSchema = z.object({
  commission_id: z.string().uuid('Invalid commission'),
  amount: z.number().positive('Amount must be greater than 0').max(100_000_000_000),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  payment_method: z.enum(['cash', 'bank_transfer', 'pos', 'online']),
  reference: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

export type CommissionPaymentFormData = z.infer<typeof commissionPaymentSchema>
