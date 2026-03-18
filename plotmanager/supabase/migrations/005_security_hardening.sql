-- ============================================
-- Security Hardening Migration
-- ============================================

-- 1. Prevent negative available_plots (TOCTOU race condition fix)
ALTER TABLE estates ADD CONSTRAINT available_plots_non_negative CHECK (available_plots >= 0);

-- 2. Missing RLS policies for commission_payments (UPDATE + DELETE)
CREATE POLICY "Users can update own company commission payments"
    ON commission_payments FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company commission payments"
    ON commission_payments FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 3. Missing RLS policies for reminders (UPDATE + DELETE)
CREATE POLICY "Users can update own company reminders"
    ON reminders FOR UPDATE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can delete own company reminders"
    ON reminders FOR DELETE TO authenticated
    USING (company_id IN (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 4. Fix storage policies: restrict update/delete to file owner
DROP POLICY IF EXISTS "Authenticated users can update estate images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete estate images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update buyer documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete buyer documents" ON storage.objects;

CREATE POLICY "Users can update own estate images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'estates' AND owner = auth.uid());

CREATE POLICY "Users can delete own estate images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'estates' AND owner = auth.uid());

CREATE POLICY "Users can update own buyer documents"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'buyer-documents' AND owner = auth.uid());

CREATE POLICY "Users can delete own buyer documents"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'buyer-documents' AND owner = auth.uid());

-- 5. Add JSONB type constraints
ALTER TABLE estates ADD CONSTRAINT plot_sizes_is_array CHECK (jsonb_typeof(plot_sizes) = 'array');
ALTER TABLE buyers ADD CONSTRAINT documents_is_array CHECK (jsonb_typeof(documents) = 'array');
