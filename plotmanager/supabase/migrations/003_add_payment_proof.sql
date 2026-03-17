-- Add payment_proof_url column to buyers table
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Create the storage bucket for buyer documents (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('buyer-documents', 'buyer-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for buyer-documents bucket
CREATE POLICY "Authenticated users can upload buyer documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'buyer-documents');

CREATE POLICY "Authenticated users can update buyer documents"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'buyer-documents');

CREATE POLICY "Authenticated users can delete buyer documents"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'buyer-documents');

CREATE POLICY "Public read access to buyer documents"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'buyer-documents');

CREATE POLICY "Service role full access to buyer-documents"
    ON storage.objects FOR ALL TO service_role
    USING (bucket_id = 'buyer-documents') WITH CHECK (bucket_id = 'buyer-documents');
