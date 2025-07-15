-- Simple Supabase Storage Setup Script
-- Run this in your Supabase Dashboard SQL Editor
-- This is a simplified version focused only on media storage

-- 1. Create the assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add new columns to asset_metadata table
ALTER TABLE asset_metadata 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_hash TEXT,
ADD COLUMN IF NOT EXISTS media_file_url TEXT,
ADD COLUMN IF NOT EXISTS media_file_hash TEXT,
ADD COLUMN IF NOT EXISTS media_file_type TEXT;

-- 3. Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;

-- 5. Create storage policies
CREATE POLICY "Public can view files" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Users can update files" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'assets');

CREATE POLICY "Users can delete files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'assets');

-- 6. Add basic indexes
CREATE INDEX IF NOT EXISTS idx_asset_metadata_cover_image_url ON asset_metadata(cover_image_url);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_media_file_url ON asset_metadata(media_file_url);

-- Setup complete - you can now upload media files to Supabase storage