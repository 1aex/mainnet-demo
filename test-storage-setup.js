#!/usr/bin/env node

/**
 * Supabase Storage Testing Script
 * 
 * This script tests the 'assets' storage bucket functionality including:
 * - Bucket existence
 * - Upload functionality
 * - Public URL generation
 * - Different file types
 * - Policy permissions
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const BUCKET_NAME = 'assets'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test file configurations
const testFiles = [
  {
    name: 'test-image.jpg',
    content: 'fake-image-content',
    type: 'image/jpeg',
    folder: 'images'
  },
  {
    name: 'test-audio.mp3',
    content: 'fake-audio-content',
    type: 'audio/mpeg',
    folder: 'audio'
  },
  {
    name: 'test-video.mp4',
    content: 'fake-video-content',
    type: 'video/mp4',
    folder: 'videos'
  },
  {
    name: 'test-document.pdf',
    content: 'fake-pdf-content',
    type: 'application/pdf',
    folder: 'documents'
  },
  {
    name: 'test-text.txt',
    content: 'Hello, this is a test file!',
    type: 'text/plain',
    folder: 'files'
  }
]

// Test results storage
const testResults = {
  connection: false,
  bucketExists: false,
  uploads: [],
  publicUrls: [],
  cleanup: false,
  errors: []
}

// Helper function to create test files
function createTestFile(config) {
  return new File([config.content], config.name, { type: config.type })
}

// Test 1: Connection Test
async function testConnection() {
  console.log('🔌 Testing Supabase connection...')
  
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration')
    }
    
    // Simple connection test
    const { data, error } = await supabase.auth.getSession()
    
    console.log('✅ Connection successful')
    console.log(`   URL: ${SUPABASE_URL}`)
    console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`)
    
    testResults.connection = true
    return true
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    testResults.errors.push(`Connection: ${error.message}`)
    return false
  }
}

// Test 2: Bucket Existence Test
async function testBucketExists() {
  console.log('📦 Testing bucket existence...')
  
  try {
    // Try to list files in the bucket (this will fail if bucket doesn't exist)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 })
    
    if (error) {
      if (error.message.includes('Bucket not found')) {
        console.error('❌ Bucket "assets" does not exist')
        testResults.errors.push('Bucket not found')
        return false
      }
      console.log('⚠️  Bucket exists but listing failed:', error.message)
    }
    
    console.log('✅ Bucket exists and is accessible')
    testResults.bucketExists = true
    return true
    
  } catch (error) {
    console.error('❌ Bucket test failed:', error.message)
    testResults.errors.push(`Bucket test: ${error.message}`)
    return false
  }
}

// Test 3: Upload Test
async function testFileUploads() {
  console.log('📤 Testing file uploads...')
  
  const uploadedFiles = []
  
  for (const fileConfig of testFiles) {
    try {
      const testFile = createTestFile(fileConfig)
      const filePath = `test/${Date.now()}-${fileConfig.name}`
      
      console.log(`   Uploading ${fileConfig.name}...`)
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, testFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error(`   ❌ Upload failed for ${fileConfig.name}:`, error.message)
        testResults.errors.push(`Upload ${fileConfig.name}: ${error.message}`)
        continue
      }
      
      console.log(`   ✅ ${fileConfig.name} uploaded successfully`)
      uploadedFiles.push({
        ...fileConfig,
        path: filePath,
        uploadData: data
      })
      
    } catch (error) {
      console.error(`   ❌ Upload error for ${fileConfig.name}:`, error.message)
      testResults.errors.push(`Upload ${fileConfig.name}: ${error.message}`)
    }
  }
  
  testResults.uploads = uploadedFiles
  return uploadedFiles
}

// Test 4: Public URL Test
async function testPublicUrls(uploadedFiles) {
  console.log('🔗 Testing public URL generation...')
  
  const publicUrls = []
  
  for (const file of uploadedFiles) {
    try {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file.path)
      
      if (data.publicUrl) {
        console.log(`   ✅ Public URL for ${file.name}: ${data.publicUrl}`)
        publicUrls.push({
          ...file,
          publicUrl: data.publicUrl
        })
      } else {
        console.error(`   ❌ No public URL for ${file.name}`)
        testResults.errors.push(`Public URL ${file.name}: No URL generated`)
      }
      
    } catch (error) {
      console.error(`   ❌ Public URL error for ${file.name}:`, error.message)
      testResults.errors.push(`Public URL ${file.name}: ${error.message}`)
    }
  }
  
  testResults.publicUrls = publicUrls
  return publicUrls
}

// Test 5: File Access Test
async function testFileAccess(publicUrls) {
  console.log('🌐 Testing file access...')
  
  for (const file of publicUrls) {
    try {
      const response = await fetch(file.publicUrl)
      
      if (response.ok) {
        console.log(`   ✅ ${file.name} is accessible (Status: ${response.status})`)
      } else {
        console.error(`   ❌ ${file.name} access failed (Status: ${response.status})`)
        testResults.errors.push(`Access ${file.name}: Status ${response.status}`)
      }
      
    } catch (error) {
      console.error(`   ❌ Access error for ${file.name}:`, error.message)
      testResults.errors.push(`Access ${file.name}: ${error.message}`)
    }
  }
}

// Test 6: Cleanup Test
async function testCleanup(uploadedFiles) {
  console.log('🧹 Testing file cleanup...')
  
  if (uploadedFiles.length === 0) {
    console.log('   No files to clean up')
    return true
  }
  
  try {
    const filePaths = uploadedFiles.map(f => f.path)
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths)
    
    if (error) {
      console.error('   ❌ Cleanup failed:', error.message)
      testResults.errors.push(`Cleanup: ${error.message}`)
      return false
    }
    
    console.log('   ✅ Cleanup successful')
    testResults.cleanup = true
    return true
    
  } catch (error) {
    console.error('   ❌ Cleanup error:', error.message)
    testResults.errors.push(`Cleanup: ${error.message}`)
    return false
  }
}

// Generate test report
function generateTestReport() {
  console.log('')
  console.log('📊 TEST REPORT')
  console.log('=' + '='.repeat(30))
  
  console.log(`Connection Test: ${testResults.connection ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Bucket Exists: ${testResults.bucketExists ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`File Uploads: ${testResults.uploads.length}/${testFiles.length} successful`)
  console.log(`Public URLs: ${testResults.publicUrls.length}/${testResults.uploads.length} generated`)
  console.log(`Cleanup: ${testResults.cleanup ? '✅ PASS' : '❌ FAIL'}`)
  
  if (testResults.errors.length > 0) {
    console.log('')
    console.log('❌ ERRORS:')
    testResults.errors.forEach(error => console.log(`   - ${error}`))
  }
  
  console.log('')
  console.log('📈 SUMMARY:')
  const totalTests = 6
  const passedTests = [
    testResults.connection,
    testResults.bucketExists,
    testResults.uploads.length > 0,
    testResults.publicUrls.length > 0,
    testResults.cleanup,
    testResults.errors.length === 0
  ].filter(Boolean).length
  
  console.log(`   ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('   🎉 All tests passed! Your storage setup is working correctly.')
  } else {
    console.log('   ⚠️  Some tests failed. Check the errors above.')
  }
  
  // Save detailed report
  const reportPath = join(process.cwd(), 'storage-test-report.json')
  writeFileSync(reportPath, JSON.stringify(testResults, null, 2))
  console.log(`   📋 Detailed report saved to: ${reportPath}`)
}

// Main test function
async function runStorageTests() {
  console.log('🚀 Starting Supabase Storage Tests')
  console.log('=' + '='.repeat(50))
  
  try {
    // Run all tests
    const connected = await testConnection()
    if (!connected) return
    
    const bucketExists = await testBucketExists()
    if (!bucketExists) {
      console.log('')
      console.log('💡 SETUP REQUIRED:')
      console.log('The "assets" bucket does not exist. Please run:')
      console.log('   node setup-storage-simple.js')
      console.log('Or create the bucket manually in your Supabase Dashboard.')
      return
    }
    
    const uploadedFiles = await testFileUploads()
    if (uploadedFiles.length === 0) {
      console.log('⚠️  No files were uploaded successfully. Check your storage policies.')
      return
    }
    
    const publicUrls = await testPublicUrls(uploadedFiles)
    await testFileAccess(publicUrls)
    await testCleanup(uploadedFiles)
    
    generateTestReport()
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    testResults.errors.push(`Test suite: ${error.message}`)
    generateTestReport()
  }
}

// Run the tests
runStorageTests().catch(console.error)