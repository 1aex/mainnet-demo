import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

async function createAssetsBucketNow() {
  console.log('🚀 Creating Assets Bucket in Supabase')
  console.log('=' .repeat(50))
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('📋 Using Supabase project:')
  console.log(`URL: ${supabaseUrl}`)
  console.log('')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check current buckets
    console.log('1️⃣ Checking existing buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message)
      return
    }
    
    console.log('📦 Current buckets:')
    if (buckets.length === 0) {
      console.log('  (No buckets found)')
    } else {
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }
    
    const assetsBucket = buckets.find(bucket => bucket.name === 'assets')
    
    if (assetsBucket) {
      console.log('\n✅ Assets bucket already exists!')
      console.log('📋 Bucket details:')
      console.log(`  Name: ${assetsBucket.name}`)
      console.log(`  Public: ${assetsBucket.public}`)
      console.log(`  Size limit: ${assetsBucket.file_size_limit || 'unlimited'}`)
      console.log(`  Created: ${assetsBucket.created_at}`)
      
      // Test upload to existing bucket
      console.log('\n🧪 Testing upload to existing bucket...')
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload('test/test.txt', testFile)

      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError.message)
        console.log('💡 This might indicate a permissions issue')
      } else {
        console.log('✅ Upload test successful!')
        
        // Clean up test file
        await supabase.storage
          .from('assets')
          .remove(['test/test.txt'])
        
        console.log('✅ Test cleanup completed')
      }
      
      return
    }
    
    // Try to create bucket
    console.log('\n2️⃣ Attempting to create assets bucket...')
    
    const { data: createData, error: createError } = await supabase.storage
      .createBucket('assets', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: null // Allow all file types
      })

    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message)
      console.log('')
      console.log('🔧 MANUAL SETUP REQUIRED:')
      console.log('')
      console.log('The anonymous key cannot create buckets. Please create manually:')
      console.log('')
      console.log('METHOD 1: Supabase Dashboard')
      console.log('1. Go to: https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Navigate to Storage')
      console.log('4. Click "Create Bucket"')
      console.log('5. Configure:')
      console.log('   - Name: assets')
      console.log('   - Public bucket: YES')
      console.log('   - File size limit: 100MB')
      console.log('   - Allowed MIME types: Leave empty')
      console.log('6. Click "Create Bucket"')
      console.log('')
      console.log('METHOD 2: SQL Commands')
      console.log('Copy this SQL to your Supabase SQL Editor:')
      console.log('')
      console.log('-- Create assets bucket')
      console.log("INSERT INTO storage.buckets (id, name, public, file_size_limit)")
      console.log("VALUES ('assets', 'assets', true, 104857600)")
      console.log("ON CONFLICT (id) DO NOTHING;")
      console.log('')
      console.log('-- Create public access policies')
      console.log('CREATE POLICY "assets_upload_policy" ON storage.objects')
      console.log("FOR INSERT WITH CHECK (bucket_id = 'assets');")
      console.log('')
      console.log('CREATE POLICY "assets_read_policy" ON storage.objects')
      console.log("FOR SELECT USING (bucket_id = 'assets');")
      console.log('')
      console.log('After creating the bucket, run this script again to test it.')
      return
    }

    console.log('✅ Assets bucket created successfully!')
    console.log('📋 Bucket details:', createData)
    
    // Test the new bucket
    console.log('\n3️⃣ Testing new bucket...')
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload('test/test.txt', testFile)

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
      console.log('💡 You may need to configure storage policies manually')
    } else {
      console.log('✅ Upload test successful!')
      
      // Clean up test file
      await supabase.storage
        .from('assets')
        .remove(['test/test.txt'])
      
      console.log('✅ Setup completed successfully!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the script
createAssetsBucketNow().catch(console.error)