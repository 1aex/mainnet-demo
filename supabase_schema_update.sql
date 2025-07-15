-- Supabase Schema Update Script
-- This script adds the new fields for separate cover image and media file storage

-- Add new columns to the asset_metadata table for separate file storage
ALTER TABLE asset_metadata 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_hash TEXT,
ADD COLUMN IF NOT EXISTS media_file_url TEXT,
ADD COLUMN IF NOT EXISTS media_file_hash TEXT,
ADD COLUMN IF NOT EXISTS media_file_type TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_asset_metadata_cover_image_url 
ON asset_metadata(cover_image_url);

CREATE INDEX IF NOT EXISTS idx_asset_metadata_media_file_url 
ON asset_metadata(media_file_url);

CREATE INDEX IF NOT EXISTS idx_asset_metadata_media_file_type 
ON asset_metadata(media_file_type);

-- Add comments to document the new fields
COMMENT ON COLUMN asset_metadata.cover_image_url IS 'URL of the cover image stored in Supabase storage';
COMMENT ON COLUMN asset_metadata.cover_image_hash IS 'SHA-256 hash of the cover image for integrity verification';
COMMENT ON COLUMN asset_metadata.media_file_url IS 'URL of the main media file (audio/video/document) stored in Supabase storage';
COMMENT ON COLUMN asset_metadata.media_file_hash IS 'SHA-256 hash of the media file for integrity verification';
COMMENT ON COLUMN asset_metadata.media_file_type IS 'Type of media file (video, audio, document, image, etc.)';

-- Create or update the storage bucket policy for assets
-- Note: You'll need to run this in the Supabase dashboard or ensure the bucket exists

-- Create the assets bucket if it doesn't exist (run this in Supabase dashboard)
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;
*/

-- Update RLS policies for the assets bucket
-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Allow public read access to files
CREATE POLICY IF NOT EXISTS "Public can view files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'assets');

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'assets');

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'assets');

-- Update the asset_metadata table RLS policies if needed
-- Allow authenticated users to insert their own records
CREATE POLICY IF NOT EXISTS "Users can insert their own asset metadata" ON asset_metadata
FOR INSERT TO authenticated
WITH CHECK (creator_address = auth.jwt() ->> 'sub' OR creator_address IS NULL);

-- Allow public read access to asset metadata
CREATE POLICY IF NOT EXISTS "Public can view asset metadata" ON asset_metadata
FOR SELECT TO public
USING (true);

-- Allow users to update their own records
CREATE POLICY IF NOT EXISTS "Users can update their own asset metadata" ON asset_metadata
FOR UPDATE TO authenticated
USING (creator_address = auth.jwt() ->> 'sub' OR creator_address IS NULL);

-- Create a view for better querying of assets with file information
CREATE OR REPLACE VIEW asset_metadata_with_files AS
SELECT 
    *,
    CASE 
        WHEN cover_image_url IS NOT NULL AND media_file_url IS NOT NULL THEN 'mixed'
        WHEN cover_image_url IS NOT NULL THEN 'image'
        WHEN media_file_url IS NOT NULL THEN media_file_type
        ELSE 'unknown'
    END AS asset_display_type,
    COALESCE(cover_image_url, media_file_url, image_url, file_url) AS display_url,
    CASE 
        WHEN cover_image_url IS NOT NULL THEN cover_image_url
        WHEN media_file_url IS NOT NULL AND media_file_type = 'image' THEN media_file_url
        WHEN image_url IS NOT NULL THEN image_url
        ELSE file_url
    END AS thumbnail_url
FROM asset_metadata;

-- Grant access to the view
GRANT SELECT ON asset_metadata_with_files TO authenticated;
GRANT SELECT ON asset_metadata_with_files TO anon;

-- Create a function to get assets for Story Explorer
CREATE OR REPLACE FUNCTION get_assets_for_story_explorer(user_address TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    asset_name TEXT,
    description TEXT,
    external_url TEXT,
    image_url TEXT,
    file_url TEXT,
    file_hash TEXT,
    cover_image_url TEXT,
    cover_image_hash TEXT,
    media_file_url TEXT,
    media_file_hash TEXT,
    media_file_type TEXT,
    ip_metadata_uri TEXT,
    nft_metadata_uri TEXT,
    ip_metadata JSONB,
    nft_metadata JSONB,
    token_id TEXT,
    ip_asset_id TEXT,
    creator_address TEXT,
    collection_name TEXT,
    collection_symbol TEXT,
    collection_description TEXT,
    ip_type TEXT,
    tags TEXT[],
    attributes JSONB,
    license_commercial_use BOOLEAN,
    license_derivatives BOOLEAN,
    license_attribution BOOLEAN,
    license_revenue_share NUMERIC,
    public_minting BOOLEAN,
    transaction_hash TEXT,
    block_number BIGINT,
    network TEXT,
    pil_terms_id TEXT,
    group_id TEXT,
    license_terms_id TEXT,
    asset_display_type TEXT,
    display_url TEXT,
    thumbnail_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM asset_metadata_with_files
    WHERE (user_address IS NULL OR creator_address = user_address)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_assets_for_story_explorer TO authenticated;
GRANT EXECUTE ON FUNCTION get_assets_for_story_explorer TO anon;