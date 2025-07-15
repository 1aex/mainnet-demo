import dotenv from 'dotenv'
import { testSupabaseConnection, testStorageBucket } from './src/utils/supabase.ts'
import { testUploadFunctionality } from './src/utils/supabaseStorage.ts'

dotenv.config()

async function testSupabaseUtils() {
  console.log('🚀 Testing Supabase Utility Functions')
  console.log('=' .repeat(50))
  
  try {
    // Test 1: Connection test
    console.log('1️⃣ Testing Supabase connection...')
    const connectionResult = await testSupabaseConnection()
    
    if (connectionResult.success) {
      console.log('✅ Connection test passed')
    } else {
      console.log('❌ Connection test failed:', connectionResult.error)
    }
    
    // Test 2: Storage bucket test
    console.log('\n2️⃣ Testing storage bucket...')
    const bucketResult = await testStorageBucket('assets')
    
    if (bucketResult.success) {
      console.log('✅ Storage bucket test passed')
    } else {
      console.log('❌ Storage bucket test failed:', bucketResult.error)
      console.log('💡 This is expected if the bucket doesn\'t exist yet')
    }
    
    // Test 3: Upload functionality test (only if bucket exists)
    if (bucketResult.success) {
      console.log('\n3️⃣ Testing upload functionality...')
      const uploadResult = await testUploadFunctionality('assets')
      
      if (uploadResult.success) {
        console.log('✅ Upload functionality test passed')
      } else {
        console.log('❌ Upload functionality test failed:', uploadResult.error)
      }
    } else {
      console.log('\n3️⃣ Skipping upload test (bucket not available)')
    }
    
    // Summary
    console.log('\n📋 Test Summary:')
    console.log(`Connection: ${connectionResult.success ? '✅ Pass' : '❌ Fail'}`)
    console.log(`Storage Bucket: ${bucketResult.success ? '✅ Pass' : '❌ Fail'}`)
    
    if (bucketResult.success) {
      const uploadResult = await testUploadFunctionality('assets')
      console.log(`Upload Functionality: ${uploadResult.success ? '✅ Pass' : '❌ Fail'}`)
    } else {
      console.log('Upload Functionality: ⏭️ Skipped (no bucket)')
    }
    
    console.log('\n🎯 Next Steps:')
    if (!bucketResult.success) {
      console.log('1. Create the "assets" bucket in your Supabase Dashboard')
      console.log('2. Set it as public with 100MB file size limit')
      console.log('3. Run this test again to verify upload functionality')
    } else {
      console.log('✅ All tests passed! Your Supabase setup is working correctly.')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run the test
testSupabaseUtils().catch(console.error)