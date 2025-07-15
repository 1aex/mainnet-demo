# Supabase Setup and Troubleshooting Guide

This guide helps you set up Supabase storage and database schema for the Story Protocol minting application.

## Quick Fix for Upload Error

If you're getting the upload error, run these SQL commands in your Supabase dashboard SQL Editor:

```sql
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

-- 3. Enable RLS and set storage policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to files
CREATE POLICY IF NOT EXISTS "Public can view files" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'assets');

-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assets');

-- Allow users to update their files
CREATE POLICY IF NOT EXISTS "Users can update files" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'assets');

-- Allow users to delete their files
CREATE POLICY IF NOT EXISTS "Users can delete files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'assets');
```

## Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting Steps

1. **Check if bucket exists**: Go to Supabase Dashboard → Storage → Should see "assets" bucket
2. **Verify environment variables**: Check browser console for configuration errors
3. **Test connection**: Try uploading a small file
4. **Check browser console**: Look for detailed error messages

## Common Errors and Solutions

- **"Bucket not found"**: Run the bucket creation SQL above
- **"403 Forbidden"**: Run the storage policy SQL above  
- **"JWT/auth error"**: Check your environment variables
- **"Relation does not exist"**: Run the schema update SQL above

After running these commands, restart your development server and try uploading again.