-- ============================================
-- Migration: Agents & Commission Tracking
-- ============================================

-- 1. AGENTS table
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

-- 2. Add agent_id to buyers
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_buyers_agent ON buyers(agent_id);

-- 3. COMMISSIONS table
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

-- 4. COMMISSION_PAYMENTS table
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

-- 5. RLS POLICIES

-- Agents
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

CREATE POLICY "Service role full access to agents"
    ON agents FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Commissions
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

CREATE POLICY "Service role full access to commissions"
    ON commissions FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Commission Payments
CREATE POLICY "Users can view own company commission payments"
    ON commission_payments FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can insert commission payments in own company"
    ON commission_payments FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Service role full access to commission_payments"
    ON commission_payments FOR ALL TO service_role
    USING (true) WITH CHECK (true);
