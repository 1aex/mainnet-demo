-- ===============================================
-- SUPABASE STORAGE BUCKET SETUP SQL COMMANDS
-- ===============================================
-- Run these commands in your Supabase Dashboard
-- Go to: SQL Editor > New Query
-- ===============================================

-- 1. Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets', 
  'assets', 
  true, 
  104857600, -- 100MB limit
  NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable Row Level Security on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for public access
-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "assets_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "assets_delete_policy" ON storage.objects;

-- Create new policies
CREATE POLICY "assets_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets');

CREATE POLICY "assets_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "assets_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'assets');

CREATE POLICY "assets_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'assets');

-- 4. Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = 'assets';

-- 5. Check policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%assets%';