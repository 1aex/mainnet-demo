import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

async function createAssetsBucket() {
  console.log('🚀 Creating Supabase Assets Bucket...')
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  try {
    // Test connection
    console.log('✅ Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('asset_metadata')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      console.error('❌ Connection failed:', connectionError.message)
      return
    }
    
    console.log('✅ Connection successful')

    // Check if bucket exists
    console.log('🔍 Checking if assets bucket exists...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error checking buckets:', bucketsError.message)
      return
    }

    const assetsBucket = buckets.find(bucket => bucket.name === 'assets')
    
    if (assetsBucket) {
      console.log('✅ Assets bucket already exists!')
      console.log('📋 Bucket details:', assetsBucket)
      
      // Test upload to verify it works
      console.log('🧪 Testing upload functionality...')
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload('test/test.txt', testFile)

      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError.message)
        console.log('💡 You may need to configure storage policies manually')
        console.log('📋 Use the SQL commands in create-assets-bucket.sql')
      } else {
        console.log('✅ Upload test successful!')
        
        // Clean up test file
        await supabase.storage
          .from('assets')
          .remove(['test/test.txt'])
        
        console.log('✅ Cleanup completed')
      }
      
      return
    }

    // Try to create bucket (this may fail with anon key)
    console.log('🔨 Attempting to create assets bucket...')
    const { data: createData, error: createError } = await supabase.storage
      .createBucket('assets', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: null // Allow all file types
      })

    if (createError) {
      console.error('❌ Failed to create bucket with anon key:', createError.message)
      console.log('')
      console.log('🔧 MANUAL SETUP REQUIRED:')
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
      console.log('OR use the SQL commands in create-assets-bucket.sql')
      return
    }

    console.log('✅ Assets bucket created successfully!')
    console.log('📋 Bucket details:', createData)
    
    // Test the new bucket
    console.log('🧪 Testing new bucket...')
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload('test/test.txt', testFile)

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
      console.log('💡 You may need to configure storage policies manually')
      console.log('📋 Use the SQL commands in create-assets-bucket.sql')
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
createAssetsBucket().catch(console.error)