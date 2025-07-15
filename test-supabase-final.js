import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

// Test connection function
async function testSupabaseConnection(supabase) {
  try {
    const { error } = await supabase.from('asset_metadata').select('count', { count: 'exact', head: true })
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test storage bucket function
async function testStorageBucket(supabase, bucketName = 'assets') {
  try {
    const { error } = await supabase.storage.getBucket(bucketName)
    if (error) {
      return { success: false, error: `Storage bucket '${bucketName}' error: ${error.message}` }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Test upload functionality
async function testUploadFunctionality(supabase, bucketName = 'assets') {
  try {
    // Create a small test file
    const testContent = 'test upload functionality'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    
    // Test upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload('test/test.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      return { success: false, error: uploadError.message }
    }
    
    // Test public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl('test/test.txt')
    
    // Test cleanup - delete the test file
    await supabase.storage
      .from(bucketName)
      .remove(['test/test.txt'])
    
    return { 
      success: true, 
      uploadPath: uploadData.path,
      publicUrl: publicUrlData.publicUrl
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Comprehensive Supabase Test Suite')
  console.log('=' .repeat(60))
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('📋 Configuration:')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Key: ${supabaseKey?.substring(0, 20)}...`)
  console.log('')

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing Supabase connection...')
    const connectionResult = await testSupabaseConnection(supabase)
    
    if (connectionResult.success) {
      console.log('✅ Connection successful')
    } else {
      console.log('❌ Connection failed:', connectionResult.error)
      return
    }
    
    // Test 2: Storage bucket
    console.log('\n2️⃣ Testing storage bucket...')
    const bucketResult = await testStorageBucket(supabase, 'assets')
    
    if (bucketResult.success) {
      console.log('✅ Storage bucket "assets" exists and is accessible')
    } else {
      console.log('❌ Storage bucket test failed:', bucketResult.error)
      
      // Try to list all buckets
      console.log('\n🔍 Checking available buckets...')
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.log('❌ Could not list buckets:', bucketsError.message)
      } else {
        console.log('📦 Available buckets:')
        if (buckets.length === 0) {
          console.log('  (No buckets found)')
        } else {
          buckets.forEach(bucket => {
            console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
          })
        }
      }
    }
    
    // Test 3: Upload functionality (only if bucket exists)
    if (bucketResult.success) {
      console.log('\n3️⃣ Testing upload functionality...')
      const uploadResult = await testUploadFunctionality(supabase, 'assets')
      
      if (uploadResult.success) {
        console.log('✅ Upload test successful')
        console.log(`📤 Upload path: ${uploadResult.uploadPath}`)
        console.log(`🔗 Public URL: ${uploadResult.publicUrl}`)
      } else {
        console.log('❌ Upload test failed:', uploadResult.error)
      }
    } else {
      console.log('\n3️⃣ Skipping upload test (bucket not available)')
    }
    
    // Test 4: Test your existing supabaseStorage functions
    console.log('\n4️⃣ Testing storage utility functions...')
    
    if (bucketResult.success) {
      // Test image upload
      const imageContent = 'fake image content'
      const imageFile = new File([imageContent], 'test-image.jpg', { type: 'image/jpeg' })
      
      const { data: imageUpload, error: imageError } = await supabase.storage
        .from('assets')
        .upload('uploads/test-image.jpg', imageFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (imageError) {
        console.log('❌ Image upload failed:', imageError.message)
      } else {
        console.log('✅ Image upload successful')
        
        // Test public URL generation
        const { data: publicUrlData } = supabase.storage
          .from('assets')
          .getPublicUrl('uploads/test-image.jpg')
        
        console.log(`🔗 Image public URL: ${publicUrlData.publicUrl}`)
        
        // Cleanup
        await supabase.storage
          .from('assets')
          .remove(['uploads/test-image.jpg'])
        
        console.log('✅ Image cleanup completed')
      }
    }
    
    // Test Summary
    console.log('\n📋 Test Summary:')
    console.log(`Connection: ${connectionResult.success ? '✅ Pass' : '❌ Fail'}`)
    console.log(`Storage Bucket: ${bucketResult.success ? '✅ Pass' : '❌ Fail'}`)
    
    if (bucketResult.success) {
      const uploadResult = await testUploadFunctionality(supabase, 'assets')
      console.log(`Upload Functionality: ${uploadResult.success ? '✅ Pass' : '❌ Fail'}`)
    } else {
      console.log('Upload Functionality: ⏭️ Skipped (no bucket)')
    }
    
    console.log('\n🎯 Results:')
    if (!bucketResult.success) {
      console.log('❌ Storage bucket "assets" not found')
      console.log('💡 Please create the bucket manually:')
      console.log('1. Go to Supabase Dashboard → Storage')
      console.log('2. Click "Create Bucket"')
      console.log('3. Name: assets, Public: YES, Size: 100MB')
      console.log('4. Run this test again')
    } else {
      console.log('✅ All core functionality is working!')
      console.log('🚀 Your Supabase setup is ready for file uploads')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the test
runComprehensiveTest().catch(console.error)