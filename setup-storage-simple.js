#!/usr/bin/env node

/**
 * Simple Supabase Storage Setup Script
 * 
 * This script provides guidance and SQL commands to set up the 'assets' storage bucket
 * in Supabase with proper policies. Since bucket creation requires service role key,
 * this script provides the SQL commands you can run in your Supabase dashboard.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wqbagygoqcprrlgredod.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

const BUCKET_NAME = 'assets'

// Test connection with anon key
async function testConnection() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase configuration')
    console.error('   Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
    return false
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('assets').select('count').limit(1)
    console.log('✅ Connection to Supabase successful')
    return true
  } catch (error) {
    console.log('✅ Connection to Supabase successful (table test not critical)')
    return true
  }
}

// Check if bucket exists
async function checkBucketExists() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
      console.log('ℹ️  Unable to list buckets with anon key (this is normal)')
      return false
    }
    
    const bucket = data.find(b => b.name === BUCKET_NAME)
    if (bucket) {
      console.log('✅ Bucket "assets" already exists')
      return true
    }
    
    console.log('❌ Bucket "assets" does not exist')
    return false
  } catch (error) {
    console.log('ℹ️  Unable to check bucket existence with anon key')
    return false
  }
}

// Test bucket upload functionality
async function testBucketUpload() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    const testContent = 'test-upload-' + Date.now()
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    const testPath = `test/${Date.now()}-test.txt`
    
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError.message)
      return false
    }
    
    console.log('✅ Test upload successful')
    
    // Test public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath)
    
    console.log('✅ Public URL:', urlData.publicUrl)
    
    // Clean up
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([testPath])
    
    console.log('✅ Test cleanup completed')
    return true
    
  } catch (error) {
    console.error('❌ Test upload failed:', error)
    return false
  }
}

// Generate SQL commands for manual setup
function generateSQLCommands() {
  return `
-- ===============================================
-- SUPABASE STORAGE BUCKET SETUP SQL COMMANDS
-- ===============================================
-- Run these commands in your Supabase Dashboard
-- Go to: SQL Editor > New Query
-- ===============================================

-- 1. Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '${BUCKET_NAME}', 
  '${BUCKET_NAME}', 
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
FOR INSERT WITH CHECK (bucket_id = '${BUCKET_NAME}');

CREATE POLICY "assets_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = '${BUCKET_NAME}');

CREATE POLICY "assets_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = '${BUCKET_NAME}');

CREATE POLICY "assets_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = '${BUCKET_NAME}');

-- 4. Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = '${BUCKET_NAME}';

-- 5. Check policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%assets%';

-- ===============================================
-- ALTERNATIVE: Create bucket via Storage UI
-- ===============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create Bucket"
-- 3. Name: ${BUCKET_NAME}
-- 4. Public bucket: YES
-- 5. File size limit: 100MB
-- 6. Allowed MIME types: Leave empty (allow all)
-- 7. Click "Create Bucket"
-- 8. Then run only the policy SQL commands above
-- ===============================================
`
}

// Main function
async function main() {
  console.log('🚀 Supabase Storage Setup Assistant')
  console.log('=' + '='.repeat(50))
  
  // Test connection
  const connected = await testConnection()
  if (!connected) {
    return
  }
  
  // Check if bucket exists
  const bucketExists = await checkBucketExists()
  
  if (!bucketExists) {
    console.log('')
    console.log('📋 SETUP INSTRUCTIONS:')
    console.log('Since the bucket doesn\'t exist, you have two options:')
    console.log('')
    console.log('OPTION 1: Use Supabase Dashboard (Recommended)')
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Navigate to Storage section')
    console.log('3. Click "Create Bucket"')
    console.log('4. Configure:')
    console.log('   - Name: assets')
    console.log('   - Public bucket: YES')
    console.log('   - File size limit: 100MB')
    console.log('   - Allowed MIME types: Leave empty')
    console.log('5. Click "Create Bucket"')
    console.log('')
    console.log('OPTION 2: Use SQL Commands')
    console.log('Copy and paste these SQL commands in your Supabase SQL Editor:')
    console.log(generateSQLCommands())
  } else {
    console.log('✅ Bucket exists, testing upload functionality...')
    const uploadWorks = await testBucketUpload()
    
    if (!uploadWorks) {
      console.log('')
      console.log('❌ Upload test failed. You may need to set up policies.')
      console.log('Run these SQL commands in your Supabase Dashboard:')
      console.log('')
      console.log('-- Storage Policies Setup')
      console.log('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('CREATE POLICY "assets_upload_policy" ON storage.objects')
      console.log('FOR INSERT WITH CHECK (bucket_id = \'assets\');')
      console.log('')
      console.log('CREATE POLICY "assets_read_policy" ON storage.objects')
      console.log('FOR SELECT USING (bucket_id = \'assets\');')
      console.log('')
      console.log('CREATE POLICY "assets_update_policy" ON storage.objects')
      console.log('FOR UPDATE USING (bucket_id = \'assets\');')
      console.log('')
      console.log('CREATE POLICY "assets_delete_policy" ON storage.objects')
      console.log('FOR DELETE USING (bucket_id = \'assets\');')
    } else {
      console.log('🎉 Everything is working! Your storage bucket is ready.')
    }
  }
  
  console.log('')
  console.log('=' + '='.repeat(50))
  console.log('📝 CORS CONFIGURATION:')
  console.log('If you experience CORS issues, add these origins in your Supabase Dashboard:')
  console.log('Settings > API > CORS Origins:')
  console.log('- http://localhost:3000')
  console.log('- http://localhost:5173')
  console.log('- http://localhost:5174')
  console.log('- Your production domain')
  console.log('')
  console.log('🔗 PUBLIC URL FORMAT:')
  console.log(`${SUPABASE_URL}/storage/v1/object/public/assets/your-file.jpg`)
  console.log('')
  console.log('💡 USAGE IN YOUR CODE:')
  console.log('// Upload file')
  console.log('const { data, error } = await supabase.storage')
  console.log('  .from(\'assets\')')
  console.log('  .upload(\'path/file.jpg\', file)')
  console.log('')
  console.log('// Get public URL')
  console.log('const { data } = supabase.storage')
  console.log('  .from(\'assets\')')
  console.log('  .getPublicUrl(\'path/file.jpg\')')
}

// Run the script
main().catch(console.error)