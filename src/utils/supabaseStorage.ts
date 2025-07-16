import { supabase } from './supabase'

export interface UploadResult {
  path: string
  publicUrl: string
  fullPath: string
}

// Upload file to Supabase storage
export async function uploadToSupabase(
  file: File, 
  bucket: string = 'assets',
  folder?: string
): Promise<UploadResult> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}_${randomString}.${fileExtension}`
  
  // Create the full path
  const filePath = folder ? `${folder}/${fileName}` : fileName

  try {

    console.log('Uploading file:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      bucket,
      filePath
    })

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error details:', {
        message: error.message,
        bucket,
        filePath,
        fileSize: file.size,
        fileType: file.type,
        error
      })
      
      // Provide more helpful error messages based on error details
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        throw new Error(`Storage bucket '${bucket}' does not exist. Please verify the bucket exists in your Supabase project.`)
      } else if (error.message.includes('Policy') || error.message.includes('RLS') || error.message.includes('403')) {
        throw new Error(`Storage access denied. Check your Row Level Security policies for the '${bucket}' bucket.`)
      } else if (error.message.includes('payload too large') || error.message.includes('413')) {
        throw new Error(`File is too large. Maximum file size may be exceeded.`)
      } else if (error.message.includes('JWT') || error.message.includes('auth') || error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your Supabase credentials.')
      } else if (error.message.includes('404')) {
        throw new Error(`Storage bucket '${bucket}' not found. Please verify it exists in your Supabase project.`)
      }
      
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('File uploaded successfully:', {
      path: filePath,
      publicUrl: publicUrlData.publicUrl
    })

    return {
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
      fullPath: data.path
    }
  } catch (error) {
    console.error('Error uploading to Supabase:', {
      error,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket,
      filePath,
      supabaseConfigured: !!supabase,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    })
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        throw new Error(`Storage bucket '${bucket}' does not exist. Please run the Supabase setup commands in SUPABASE_SETUP.md`)
      } else if (error.message.includes('Policy') || error.message.includes('RLS') || error.message.includes('403')) {
        throw new Error(`Storage access denied. Please check your storage policies. See SUPABASE_SETUP.md for setup instructions.`)
      } else if (error.message.includes('payload too large') || error.message.includes('413')) {
        throw new Error(`File is too large. Maximum file size may be exceeded. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      } else if (error.message.includes('JWT') || error.message.includes('auth') || error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your Supabase credentials in .env file.')
      }
    }
    
    throw error
  }
}

// Get public URL for a file in Supabase storage
export function getSupabasePublicUrl(path: string, bucket: string = 'assets'): string {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

// Get optimized image URL from Supabase with transformations
export function getSupabaseImageUrl(
  path: string, 
  bucket: string = 'assets', 
  _options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  }
): string {
  if (!supabase) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  const imageUrl = data.publicUrl
  console.log('Base public URL:', imageUrl)

  // For now, let's not add transformations as they might not be supported
  // Just return the direct public URL
  console.log('Returning direct public URL:', imageUrl)
  return imageUrl
  
  // TODO: Add transformations when Supabase supports them
  // if (options) {
  //   const transformParams = new URLSearchParams()
  //   
  //   if (options.width) transformParams.append('width', options.width.toString())
  //   if (options.height) transformParams.append('height', options.height.toString())
  //   if (options.quality) transformParams.append('quality', options.quality.toString())
  //   if (options.format) transformParams.append('format', options.format)
  //   
  //   if (transformParams.toString()) {
  //     imageUrl += `?${transformParams.toString()}`
  //   }
  // }
}

// Check if a URL is a Supabase storage URL
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false
  return url.includes('supabase.co') || url.includes('supabase.in')
}

// Extract file path from Supabase public URL
export function extractPathFromSupabaseUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null
  
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    // Remove '/storage/v1/object/public/bucket-name/' to get the actual file path
    const bucketIndex = pathParts.findIndex(part => part === 'public')
    if (bucketIndex >= 0 && bucketIndex < pathParts.length - 2) {
      return pathParts.slice(bucketIndex + 2).join('/')
    }
  } catch (error) {
    console.error('Error extracting path from Supabase URL:', error)
  }
  
  return null
}

// Get thumbnail URL for images
export function getSupabaseThumbnailUrl(
  imageUrl: string, 
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  console.log('getSupabaseThumbnailUrl called with:', { imageUrl, size })
  
  if (!imageUrl) {
    console.log('No image URL provided')
    return ''
  }

  if (!isSupabaseStorageUrl(imageUrl)) {
    console.log('Not a Supabase URL, returning original:', imageUrl)
    return imageUrl // Return original URL if not a Supabase URL
  }

  const path = extractPathFromSupabaseUrl(imageUrl)
  console.log('Extracted path:', path)
  
  if (!path) {
    console.log('Could not extract path, returning original URL')
    return imageUrl
  }

  // For now, just return the direct public URL since transformations might not be supported
  const directUrl = getSupabaseImageUrl(path, 'assets')
  
  console.log('Generated direct URL:', directUrl)
  return directUrl
}

// Delete file from Supabase storage
export async function deleteFromSupabase(path: string, bucket: string = 'assets'): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('Error deleting from Supabase:', error)
    throw error
  }
}

// Generate file hash for integrity checking
export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Upload file with hash generation
export async function uploadWithHash(
  file: File, 
  bucket: string = 'assets',
  folder?: string
): Promise<UploadResult & { hash: string }> {
  try {
    const [uploadResult, hash] = await Promise.all([
      uploadToSupabase(file, bucket, folder),
      generateFileHash(file)
    ])

    return {
      ...uploadResult,
      hash
    }
  } catch (error) {
    console.error('Upload with hash failed:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        throw new Error(`Storage bucket '${bucket}' does not exist. Please verify the bucket name and ensure it exists in your Supabase project.`)
      }
      if (error.message.includes('Policy') || error.message.includes('RLS')) {
        throw new Error(`Storage access denied. Please check your Row Level Security policies for the '${bucket}' bucket.`)
      }
      if (error.message.includes('JWT') || error.message.includes('auth')) {
        throw new Error('Authentication failed. Please ensure your Supabase credentials are correct.')
      }
    }
    
    throw error
  }
}

// Test upload functionality with a small test file
export async function testUploadFunctionality(bucket: string = 'assets'): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Create a small test file
    const testContent = 'test upload functionality'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    
    // Test upload
    const result = await uploadToSupabase(testFile, bucket, 'test')
    
    // Test cleanup - delete the test file
    await deleteFromSupabase(result.path, bucket)
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown upload test error' 
    }
  }
}

// Comprehensive Supabase diagnostics
export async function diagnoseSupabaseSetup(): Promise<{
  configured: boolean
  bucketExists: boolean
  canUpload: boolean
  errors: string[]
  recommendations: string[]
}> {
  const errors: string[] = []
  const recommendations: string[] = []
  
  // Check basic configuration
  if (!supabase) {
    errors.push('Supabase client not initialized')
    recommendations.push('Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    return { configured: false, bucketExists: false, canUpload: false, errors, recommendations }
  }

  let bucketExists = false
  let canUpload = false

  try {
    // Test bucket access
    const { error: listError } = await supabase.storage.from('assets').list('', { limit: 1 })
    
    if (listError) {
      if (listError.message.includes('Bucket not found')) {
        errors.push('Assets bucket does not exist')
        recommendations.push('Run: INSERT INTO storage.buckets (id, name, public) VALUES (\'assets\', \'assets\', true);')
      } else if (listError.message.includes('Policy') || listError.message.includes('RLS')) {
        errors.push('Storage policies not configured properly')
        recommendations.push('Set up storage policies as shown in SUPABASE_SETUP.md')
      } else {
        errors.push(`Bucket access error: ${listError.message}`)
      }
    } else {
      bucketExists = true
    }

    // Test upload capability
    if (bucketExists) {
      const testResult = await testUploadFunctionality()
      if (testResult.success) {
        canUpload = true
      } else {
        errors.push(`Upload test failed: ${testResult.error}`)
        recommendations.push('Check storage policies and bucket permissions')
      }
    }

  } catch (error) {
    errors.push(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl.includes('your_supabase_url')) {
    errors.push('VITE_SUPABASE_URL not properly configured')
    recommendations.push('Set VITE_SUPABASE_URL in your .env file')
  }

  if (!supabaseKey || supabaseKey.includes('your_supabase_anon_key')) {
    errors.push('VITE_SUPABASE_ANON_KEY not properly configured')  
    recommendations.push('Set VITE_SUPABASE_ANON_KEY in your .env file')
  }

  return {
    configured: !!supabase,
    bucketExists,
    canUpload,
    errors,
    recommendations
  }
}