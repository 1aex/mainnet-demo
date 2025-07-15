#!/usr/bin/env node

/**
 * Supabase Storage Bucket Setup Script
 * 
 * This script creates the 'assets' storage bucket in Supabase with proper
 * Row Level Security policies for public file uploads and reads.
 * 
 * Requirements:
 * - Node.js environment
 * - @supabase/supabase-js package
 * - Valid Supabase URL and Service Role Key (not anon key)
 * 
 * Note: This script requires the SERVICE ROLE KEY, not the anon key.
 * You can find it in your Supabase dashboard under Settings > API > Service Role Key
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wqbagygoqcprrlgredod.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

// Bucket configuration
const BUCKET_NAME = 'assets'
const BUCKET_CONFIG = {
  public: true,
  allowedMimeTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp3',
    'audio/aac',
    'audio/flac',
    'audio/webm',
    // Video
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/mkv',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-zip-compressed'
  ],
  fileSizeLimit: 104857600, // 100MB
  allowedMimeTypes: null // Allow all file types for flexibility
}

// Initialize Supabase client with service role key
function initializeSupabase() {
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is required')
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('⚠️  SUPABASE_SERVICE_ROLE_KEY is required for this script')
    console.error('   You can find it in your Supabase dashboard:')
    console.error('   Settings > API > Service Role Key')
    console.error('   Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    process.exit(1)
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Create storage bucket
async function createBucket(supabase) {
  console.log(`📦 Creating storage bucket: ${BUCKET_NAME}`)
  
  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: BUCKET_CONFIG.public,
    allowedMimeTypes: BUCKET_CONFIG.allowedMimeTypes,
    fileSizeLimit: BUCKET_CONFIG.fileSizeLimit
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Bucket already exists, continuing with policy setup')
      return true
    }
    console.error('❌ Error creating bucket:', error)
    return false
  }

  console.log('✅ Bucket created successfully')
  return true
}

// Create RLS policies for the storage bucket
async function createStoragePolicies(supabase) {
  console.log('🔒 Setting up Row Level Security policies...')
  
  // Policy for public uploads
  const uploadPolicy = `
    CREATE POLICY "Public Upload Policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = '${BUCKET_NAME}');
  `

  // Policy for public reads
  const readPolicy = `
    CREATE POLICY "Public Read Policy" ON storage.objects
    FOR SELECT USING (bucket_id = '${BUCKET_NAME}');
  `

  // Policy for public updates (optional, for file replacements)
  const updatePolicy = `
    CREATE POLICY "Public Update Policy" ON storage.objects
    FOR UPDATE USING (bucket_id = '${BUCKET_NAME}');
  `

  // Policy for public deletes (optional, be careful with this)
  const deletePolicy = `
    CREATE POLICY "Public Delete Policy" ON storage.objects
    FOR DELETE USING (bucket_id = '${BUCKET_NAME}');
  `

  const policies = [
    { name: 'Upload Policy', sql: uploadPolicy },
    { name: 'Read Policy', sql: readPolicy },
    { name: 'Update Policy', sql: updatePolicy },
    { name: 'Delete Policy', sql: deletePolicy }
  ]

  // First, enable RLS on the storage.objects table
  const enableRLS = `
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  `

  try {
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLS })
    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.log('⚠️  RLS enable result:', rlsError.message)
    }
  } catch (error) {
    console.log('ℹ️  RLS might already be enabled')
  }

  // Create each policy
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql })
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ ${policy.name} already exists`)
        } else {
          console.error(`❌ Error creating ${policy.name}:`, error.message)
        }
      } else {
        console.log(`✅ ${policy.name} created successfully`)
      }
    } catch (error) {
      console.error(`❌ Error creating ${policy.name}:`, error)
    }
  }
}

// Alternative method: Create policies using direct SQL
async function createPoliciesDirectSQL(supabase) {
  console.log('🔒 Setting up storage policies using direct SQL...')
  
  const policies = [
    {
      name: 'assets_upload_policy',
      sql: `
        CREATE POLICY "assets_upload_policy" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = '${BUCKET_NAME}');
      `
    },
    {
      name: 'assets_read_policy', 
      sql: `
        CREATE POLICY "assets_read_policy" ON storage.objects
        FOR SELECT USING (bucket_id = '${BUCKET_NAME}');
      `
    },
    {
      name: 'assets_update_policy',
      sql: `
        CREATE POLICY "assets_update_policy" ON storage.objects
        FOR UPDATE USING (bucket_id = '${BUCKET_NAME}');
      `
    },
    {
      name: 'assets_delete_policy',
      sql: `
        CREATE POLICY "assets_delete_policy" ON storage.objects
        FOR DELETE USING (bucket_id = '${BUCKET_NAME}');
      `
    }
  ]

  // Drop existing policies first to avoid conflicts
  for (const policy of policies) {
    const dropSQL = `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`
    await supabase.rpc('exec_sql', { sql: dropSQL })
  }

  // Create new policies
  for (const policy of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql })
    if (error) {
      console.error(`❌ Error creating ${policy.name}:`, error.message)
    } else {
      console.log(`✅ ${policy.name} created successfully`)
    }
  }
}

// Test bucket functionality
async function testBucket(supabase) {
  console.log('🧪 Testing bucket functionality...')
  
  try {
    // Test bucket existence
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return false
    }
    
    const bucket = buckets.find(b => b.name === BUCKET_NAME)
    if (!bucket) {
      console.error('❌ Bucket not found in bucket list')
      return false
    }
    
    console.log('✅ Bucket exists and is accessible')
    console.log(`   - Name: ${bucket.name}`)
    console.log(`   - Public: ${bucket.public}`)
    console.log(`   - Created: ${bucket.created_at}`)
    
    // Test file upload with a simple test file
    const testContent = 'test-upload-' + Date.now()
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    const testPath = `test/${Date.now()}-test.txt`
    
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError)
      return false
    }
    
    console.log('✅ Test upload successful')
    
    // Test public URL generation
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath)
    
    if (urlData.publicUrl) {
      console.log('✅ Public URL generation successful')
      console.log(`   URL: ${urlData.publicUrl}`)
    }
    
    // Clean up test file
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([testPath])
    
    console.log('✅ Test cleanup completed')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Main setup function
async function setupStorageBucket() {
  console.log('🚀 Starting Supabase Storage Bucket Setup')
  console.log('=' + '='.repeat(50))
  
  try {
    // Initialize Supabase client
    const supabase = initializeSupabase()
    console.log('✅ Supabase client initialized')
    
    // Create bucket
    const bucketCreated = await createBucket(supabase)
    if (!bucketCreated) {
      throw new Error('Failed to create bucket')
    }
    
    // Create storage policies
    await createPoliciesDirectSQL(supabase)
    
    // Test bucket functionality
    const testPassed = await testBucket(supabase)
    if (!testPassed) {
      console.log('⚠️  Some tests failed, but bucket setup may still be functional')
    }
    
    console.log('=' + '='.repeat(50))
    console.log('🎉 Storage bucket setup completed!')
    console.log(`   Bucket name: ${BUCKET_NAME}`)
    console.log(`   Public access: ${BUCKET_CONFIG.public}`)
    console.log(`   File size limit: ${BUCKET_CONFIG.fileSizeLimit / 1024 / 1024}MB`)
    console.log('')
    console.log('💡 Usage in your application:')
    console.log(`   const { data, error } = await supabase.storage`)
    console.log(`     .from('${BUCKET_NAME}')`)
    console.log(`     .upload('path/to/file.jpg', file)`)
    console.log('')
    console.log('🔗 Public URL format:')
    console.log(`   ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/path/to/file.jpg`)
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupStorageBucket()
}

export { setupStorageBucket, BUCKET_NAME, BUCKET_CONFIG }