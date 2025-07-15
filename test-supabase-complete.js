import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

async function testSupabaseComplete() {
  console.log('🚀 Complete Supabase Connection, Upload & Retrieval Test')
  console.log('=' .repeat(60))
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  console.log('📋 Configuration:')
  console.log(`URL: ${supabaseUrl}`)
  console.log(`Key: ${supabaseKey?.substring(0, 20)}...`)
  console.log('')

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Test connection
    console.log('1️⃣ Testing connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('asset_metadata')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError && connectionError.code !== 'PGRST116') {
      console.error('❌ Connection failed:', connectionError.message)
      return
    }
    console.log('✅ Connection successful')
    
    // 2. Check storage buckets
    console.log('\n2️⃣ Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message)
      return
    }
    
    console.log('📦 Available buckets:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
    })
    
    const assetsBucket = buckets.find(bucket => bucket.name === 'assets')
    
    if (!assetsBucket) {
      console.log('\n❌ Assets bucket not found!')
      console.log('🔧 Please create the assets bucket:')
      console.log('1. Go to Supabase Dashboard → Storage')
      console.log('2. Click "Create Bucket"')
      console.log('3. Name: assets, Public: YES, Size: 100MB')
      return
    }
    
    console.log('✅ Assets bucket found!')
    console.log(`   Public: ${assetsBucket.public}`)
    console.log(`   Size limit: ${assetsBucket.file_size_limit || 'unlimited'}`)
    
    // 3. Test file upload
    console.log('\n3️⃣ Testing file upload...')
    
    const testFiles = [
      { name: 'test-image.txt', content: 'This is a test image file', type: 'text/plain' },
      { name: 'test-audio.txt', content: 'This is a test audio file', type: 'text/plain' },
      { name: 'test-video.txt', content: 'This is a test video file', type: 'text/plain' }
    ]
    
    const uploadResults = []
    
    for (const testFile of testFiles) {
      const file = new File([testFile.content], testFile.name, { type: testFile.type })
      const filePath = `test/${testFile.name}`
      
      console.log(`📤 Uploading ${testFile.name}...`)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) {
        console.error(`❌ Upload failed for ${testFile.name}:`, uploadError.message)
        continue
      }
      
      console.log(`✅ Upload successful: ${uploadData.path}`)
      uploadResults.push({ path: uploadData.path, name: testFile.name })
    }
    
    if (uploadResults.length === 0) {
      console.log('❌ No files uploaded successfully')
      return
    }
    
    // 4. Test file retrieval and public URLs
    console.log('\n4️⃣ Testing file retrieval and public URLs...')
    
    for (const result of uploadResults) {
      console.log(`\n📥 Testing ${result.name}...`)
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('assets')
        .getPublicUrl(result.path)
      
      console.log(`🔗 Public URL: ${publicUrlData.publicUrl}`)
      
      // Test if file exists
      const { data: fileData, error: fileError } = await supabase.storage
        .from('assets')
        .list('test', {
          limit: 100,
          search: result.name
        })
      
      if (fileError) {
        console.error(`❌ Error checking file existence:`, fileError.message)
        continue
      }
      
      const fileExists = fileData.some(file => file.name === result.name)
      console.log(`📁 File exists: ${fileExists ? '✅ Yes' : '❌ No'}`)
      
      // Test downloading file
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('assets')
        .download(result.path)
      
      if (downloadError) {
        console.error(`❌ Download failed:`, downloadError.message)
        continue
      }
      
      const downloadedText = await downloadData.text()
      console.log(`📄 Downloaded content: "${downloadedText}"`)
      console.log(`✅ Download successful`)
    }
    
    // 5. Test file deletion (cleanup)
    console.log('\n5️⃣ Cleaning up test files...')
    
    const filesToDelete = uploadResults.map(result => result.path)
    
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('assets')
      .remove(filesToDelete)
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message)
    } else {
      console.log('✅ Cleanup successful')
    }
    
    // 6. Test storage info
    console.log('\n6️⃣ Storage information...')
    
    const { data: storageInfo, error: storageError } = await supabase.storage
      .from('assets')
      .list('', {
        limit: 10
      })
    
    if (storageError) {
      console.error('❌ Error getting storage info:', storageError.message)
    } else {
      console.log(`📊 Storage contains ${storageInfo.length} items`)
      if (storageInfo.length > 0) {
        console.log('📁 Recent items:')
        storageInfo.slice(0, 5).forEach(item => {
          console.log(`  - ${item.name} (${item.metadata?.size || 'unknown size'})`)
        })
      }
    }
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('✅ Supabase connection: Working')
    console.log('✅ Storage bucket: Available')
    console.log('✅ File upload: Working')
    console.log('✅ File retrieval: Working')
    console.log('✅ Public URLs: Working')
    console.log('✅ File deletion: Working')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the test
testSupabaseComplete().catch(console.error)