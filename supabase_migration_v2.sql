-- ABMEL v2 Schema Migration
-- Run this in Supabase SQL Editor

-- Add new fields to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS num_variants INT DEFAULT 3;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS key_features TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_platforms TEXT[];

-- Create brand-assets storage bucket (run if not already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to upload their own brand assets
CREATE POLICY "Users can upload brand assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own brand assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
