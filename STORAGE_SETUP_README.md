# Supabase Storage Setup Guide

This guide will help you create and configure the 'assets' storage bucket in Supabase for your file upload functionality.

## Quick Setup (Recommended)

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"Create Bucket"**
5. Configure the bucket:
   - **Name**: `assets`
   - **Public bucket**: ✅ **YES** (Enable this!)
   - **File size limit**: `100MB` (or your preferred limit)
   - **Allowed MIME types**: Leave empty (allows all file types)
6. Click **"Create Bucket"**

### Option 2: Using SQL Commands

If you prefer SQL, go to **SQL Editor** in your Supabase Dashboard and run:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets', 
  'assets', 
  true, 
  104857600, -- 100MB limit
  NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "assets_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets');

CREATE POLICY "assets_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "assets_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'assets');

CREATE POLICY "assets_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'assets');
```

## Setup Scripts

### 1. Simple Setup Assistant

Run this script to get setup instructions and test your configuration:

```bash
node setup-storage-simple.js
```

This script will:
- Test your Supabase connection
- Check if the bucket exists
- Provide setup instructions
- Test upload functionality
- Generate SQL commands if needed

### 2. Advanced Setup (Service Role Key Required)

If you have your Supabase Service Role Key, you can use the automated setup:

```bash
# Add your service role key to .env
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env

# Run the setup script
node setup-supabase-storage.js
```

**Note**: The Service Role Key is found in your Supabase Dashboard under **Settings > API > Service Role Key**.

### 3. Test Your Setup

After creating the bucket, test everything works:

```bash
node test-storage-setup.js
```

This comprehensive test will:
- Test connection to Supabase
- Verify bucket exists
- Test file uploads (images, audio, video, documents)
- Test public URL generation
- Test file access
- Clean up test files
- Generate a detailed report

## Configuration Details

### Supported File Types

The bucket is configured to support:

- **Images**: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF
- **Audio**: MP3, WAV, OGG, AAC, FLAC, WebM
- **Video**: MP4, WebM, OGG, AVI, MOV, WMV, FLV, MKV
- **Documents**: PDF, Word, Excel, PowerPoint, TXT, CSV, JSON, ZIP

### Security Policies

The setup creates Row Level Security policies that allow:

- **Public uploads**: Anyone can upload files
- **Public reads**: Anyone can read/download files
- **Public updates**: Anyone can update files
- **Public deletes**: Anyone can delete files

### File Size Limits

- **Default limit**: 100MB per file
- **Configurable**: Can be adjusted in bucket settings

## CORS Configuration

If you experience CORS issues, add these origins in your Supabase Dashboard:

**Settings > API > CORS Origins**:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- Your production domain

## Usage in Your Application

### Basic Upload

```javascript
import { supabase } from './utils/supabase'

async function uploadFile(file) {
  const fileName = `${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('assets')
    .upload(fileName, file)
  
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  
  return data
}
```

### Get Public URL

```javascript
function getPublicUrl(filePath) {
  const { data } = supabase.storage
    .from('assets')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}
```

### Upload with Organized Folders

```javascript
async function uploadToFolder(file, folder) {
  const fileName = `${Date.now()}-${file.name}`
  const filePath = `${folder}/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('assets')
    .upload(filePath, file)
  
  if (error) throw error
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('assets')
    .getPublicUrl(filePath)
  
  return {
    path: filePath,
    publicUrl: urlData.publicUrl
  }
}

// Usage
const result = await uploadToFolder(imageFile, 'images')
const audioResult = await uploadToFolder(audioFile, 'audio')
```

## Public URL Format

Files uploaded to the bucket will be accessible at:

```
https://your-project-id.supabase.co/storage/v1/object/public/assets/your-file.jpg
```

## Troubleshooting

### Common Issues

1. **"Bucket not found" error**
   - Solution: Create the bucket using the instructions above

2. **"Policy" errors during upload**
   - Solution: Run the SQL policy commands in your Supabase Dashboard

3. **CORS errors**
   - Solution: Add your domain to CORS origins in Supabase settings

4. **File size too large**
   - Solution: Adjust the file size limit in bucket settings

5. **Upload works but files not accessible**
   - Solution: Ensure bucket is set to **public** and policies are created

### Testing Your Setup

Run the test script to diagnose issues:

```bash
node test-storage-setup.js
```

This will generate a detailed report and help identify any configuration problems.

## Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Only needed for automated setup
```

## Security Considerations

### Current Setup (Public Access)

The current setup allows public access to all files. This is suitable for:
- Public content
- User-generated content that should be publicly accessible
- Applications where all users should access all files

### For More Security

If you need user-specific access control, modify the policies:

```sql
-- Example: Only allow authenticated users to upload
CREATE POLICY "authenticated_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.uid() IS NOT NULL);

-- Example: Users can only access their own files
CREATE POLICY "user_files_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Next Steps

1. Run the setup (Option 1 or 2 above)
2. Test your configuration (`node test-storage-setup.js`)
3. Update your application code to use the storage bucket
4. Test file uploads in your application
5. Monitor usage in your Supabase Dashboard

## Support

If you encounter issues:

1. Check the test results from `test-storage-setup.js`
2. Review the Supabase Dashboard for error messages
3. Verify your environment variables are correct
4. Check the Supabase Storage documentation: https://supabase.com/docs/guides/storage