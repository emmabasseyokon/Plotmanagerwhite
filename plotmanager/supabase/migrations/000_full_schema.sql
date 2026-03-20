-- ================================================================
-- PlotManager White-Label — Full Database Schema
-- Run this in a fresh Supabase project SQL Editor to set up everything
-- ================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- UTILITY: updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. COMPANIES (single company record)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    form_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_days_before INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. PROFILES (admin users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. ESTATES
-- ============================================
CREATE TABLE IF NOT EXISTS estates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    image_url TEXT,
    total_plots INTEGER NOT NULL DEFAULT 0,
    available_plots INTEGER NOT NULL DEFAULT 0 CHECK (available_plots >= 0),
    price_per_plot NUMERIC(15, 2) DEFAULT 0,
    plot_sizes JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(plot_sizes) = 'array'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold_out', 'coming_soon')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_estates_updated_at
    BEFORE UPDATE ON estates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_estates_company ON estates(company_id);
CREATE INDEX IF NOT EXISTS idx_estates_status ON estates(status);

ALTER TABLE estates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. AGENTS
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_name TEXT,
    commission_type TEXT NOT NULL DEFAULT 'percentage'
        CHECK (commission_type IN ('percentage', 'flat')),
    commission_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_agents_company ON agents(company_id);
CREATE INDEX IF NOT EXISTS idx_agents_phone ON agents(phone);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. BUYERS
-- ============================================
CREATE TABLE IF NOT EXISTS buyers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    estate_id UUID REFERENCES estates(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    gender TEXT,
    home_address TEXT,
    city TEXT,
    state TEXT,
    plot_size TEXT,
    plot_location TEXT,
    plot_number TEXT,
    number_of_plots INTEGER DEFAULT 1,
    purchase_date DATE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    next_payment_date DATE,
    payment_status TEXT NOT NULL DEFAULT 'installment'
        CHECK (payment_status IN ('fully_paid', 'installment', 'overdue')),
    has_installment_plan BOOLEAN DEFAULT FALSE,
    initial_deposit NUMERIC(15, 2) DEFAULT 0,
    plan_duration_months INTEGER,
    plan_start_date DATE,
    next_of_kin_name TEXT,
    next_of_kin_phone TEXT,
    next_of_kin_address TEXT,
    next_of_kin_relationship TEXT,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    referral_source TEXT,
    referral_phone TEXT,
    allocation_status TEXT NOT NULL DEFAULT 'not_allocated'
        CHECK (allocation_status IN ('allocated', 'not_allocated')),
    payment_proof_url TEXT,
    documents JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(documents) = 'array'),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_buyers_updated_at
    BEFORE UPDATE ON buyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_buyers_company ON buyers(company_id);
CREATE INDEX IF NOT EXISTS idx_buyers_estate ON buyers(estate_id);
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers(payment_status);
CREATE INDEX IF NOT EXISTS idx_buyers_created ON buyers(created_at DESC);

ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. COMMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    commission_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'partially_paid', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_commissions_company ON commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_buyer ON commissions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. COMMISSION_PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS commission_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer'
        CHECK (payment_method IN ('cash', 'bank_transfer', 'pos', 'online')),
    reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_payments_company ON commission_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_commission ON commission_payments(commission_id);

ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. PAYMENTS (payment history per buyer)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer'
        CHECK (payment_method IN ('cash', 'bank_transfer', 'pos', 'online')),
    reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_buyer ON payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. PAYMENT SCHEDULES (installment tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    expected_amount NUMERIC(15, 2) NOT NULL,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'partial', 'overdue')),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_payment_schedules_updated_at
    BEFORE UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_schedules_company ON payment_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_schedules_buyer ON payment_schedules(buyer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_due ON payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON payment_schedules(status);

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. REMINDERS
-- ============================================
CREATE TABLE IF NOT EXISTS reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL DEFAULT 'payment_due'
        CHECK (reminder_type IN ('payment_due', 'custom')),
    message TEXT NOT NULL,
    sent_via TEXT NOT NULL DEFAULT 'email'
        CHECK (sent_via IN ('email', 'whatsapp', 'sms')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_company ON reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_reminders_buyer ON reminders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent_at DESC);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. ACTIVITY LOGS (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_label TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS POLICIES
-- ============================================

-- Companies: admins can see their own company
CREATE POLICY "Users can view own company"
    ON companies FOR SELECT TO authenticated
    USING (id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Profiles: users can only view their own profile (non-recursive)
-- NOTE: Do NOT use a subquery on profiles itself here — that causes
-- PostgreSQL infinite recursion when evaluating the RLS policy.
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- Estates: admins can CRUD estates in their company
CREATE POLICY "Users can view own company estates"
    ON estates FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert estates in own company"
    ON estates FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company estates"
    ON estates FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company estates"
    ON estates FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Agents: admins can CRUD agents in their company
CREATE POLICY "Users can view own company agents"
    ON agents FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert agents in own company"
    ON agents FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company agents"
    ON agents FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company agents"
    ON agents FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Buyers: admins can CRUD buyers in their company
CREATE POLICY "Users can view own company buyers"
    ON buyers FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert buyers in own company"
    ON buyers FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company buyers"
    ON buyers FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company buyers"
    ON buyers FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Payments: admins can CRUD payments in their company
CREATE POLICY "Users can view own company payments"
    ON payments FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert payments in own company"
    ON payments FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company payments"
    ON payments FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company payments"
    ON payments FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Payment Schedules: admins can CRUD schedules in their company
CREATE POLICY "Users can view own company schedules"
    ON payment_schedules FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert schedules in own company"
    ON payment_schedules FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company schedules"
    ON payment_schedules FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company schedules"
    ON payment_schedules FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Commissions: admins can CRUD commissions in their company
CREATE POLICY "Users can view own company commissions"
    ON commissions FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert commissions in own company"
    ON commissions FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company commissions"
    ON commissions FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company commissions"
    ON commissions FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Commission Payments: admins can view and insert
CREATE POLICY "Users can view own company commission payments"
    ON commission_payments FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert commission payments in own company"
    ON commission_payments FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company commission payments"
    ON commission_payments FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company commission payments"
    ON commission_payments FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Reminders: admins can CRUD reminders in their company
CREATE POLICY "Users can view own company reminders"
    ON reminders FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert reminders in own company"
    ON reminders FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can update own company reminders"
    ON reminders FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company reminders"
    ON reminders FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- Activity Logs: admins can view their company's logs
CREATE POLICY "Users can view own company activity logs"
    ON activity_logs FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- ============================================
-- 12. SERVICE ROLE POLICIES (for API operations)
-- ============================================
CREATE POLICY "Service role full access to companies"
    ON companies FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to profiles"
    ON profiles FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to estates"
    ON estates FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to buyers"
    ON buyers FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to payments"
    ON payments FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to payment_schedules"
    ON payment_schedules FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to agents"
    ON agents FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to commissions"
    ON commissions FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to commission_payments"
    ON commission_payments FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to reminders"
    ON reminders FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to activity_logs"
    ON activity_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================
-- 13. STORAGE: Estate images bucket & policies
-- ============================================

-- Create the storage bucket for estate images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('estates', 'estates', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload estate images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'estates');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update own estate images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'estates' AND owner = auth.uid());

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own estate images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'estates' AND owner = auth.uid());

-- Allow public read access to estate images
CREATE POLICY "Public read access to estate images"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'estates');

-- ============================================
-- 14. STORAGE: Buyer documents bucket & policies
-- ============================================

-- Create the storage bucket for buyer documents (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('buyer-documents', 'buyer-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload buyer documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'buyer-documents');

CREATE POLICY "Users can update own buyer documents"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'buyer-documents' AND owner = auth.uid());

CREATE POLICY "Users can delete own buyer documents"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'buyer-documents' AND owner = auth.uid());

CREATE POLICY "Public read access to buyer documents"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'buyer-documents');

-- Service role full access to buyer-documents bucket
CREATE POLICY "Service role full access to buyer-documents"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'buyer-documents') WITH CHECK (bucket_id = 'buyer-documents');

-- ============================================
-- 15. SEED: Pre-create the company
-- Replace these values with the client's details
-- Then set APP_COMPANY_ID in .env.local to the generated UUID
-- ============================================
-- INSERT INTO companies (id, name, slug, email, phone, form_enabled)
-- VALUES (
--     gen_random_uuid(),
--     'ABC Homes',
--     'abc-homes',
--     'info@abchomes.com',
--     '+2349012345678',
--     true
-- );
