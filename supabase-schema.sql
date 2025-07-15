-- Story Protocol Minting Database Schema
-- Execute this in your Supabase SQL Editor

-- Create asset_metadata table
CREATE TABLE IF NOT EXISTS asset_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    asset_name TEXT NOT NULL,
    description TEXT,
    external_url TEXT,
    image_url TEXT,
    ipfs_hash TEXT,
    metadata_ipfs_hash TEXT,
    nft_metadata_ipfs_hash TEXT,
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
    group_id TEXT
);

-- Create ip_groups table
CREATE TABLE IF NOT EXISTS ip_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    group_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    creator_address TEXT,
    group_metadata JSONB,
    member_count INTEGER DEFAULT 0,
    creation_tx_hash TEXT,
    network TEXT
);

-- Create pil_terms table
CREATE TABLE IF NOT EXISTS pil_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pil_terms_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    commercial_use BOOLEAN DEFAULT false,
    commercial_attribution BOOLEAN DEFAULT false,
    commercializer_check BOOLEAN DEFAULT false,
    commercializer_check_data TEXT,
    commercial_rev_share NUMERIC DEFAULT 0,
    derivatives_allowed BOOLEAN DEFAULT true,
    derivatives_attribution BOOLEAN DEFAULT true,
    derivatives_approval BOOLEAN DEFAULT false,
    derivatives_reciprocal BOOLEAN DEFAULT false,
    territory_expansion BOOLEAN DEFAULT false,
    distribution_channels TEXT[],
    content_restrictions BOOLEAN DEFAULT false,
    terms_metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_metadata_creator ON asset_metadata(creator_address);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_ip_asset_id ON asset_metadata(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_token_id ON asset_metadata(token_id);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_created_at ON asset_metadata(created_at);

CREATE INDEX IF NOT EXISTS idx_ip_groups_creator ON ip_groups(creator_address);
CREATE INDEX IF NOT EXISTS idx_ip_groups_group_id ON ip_groups(group_id);

CREATE INDEX IF NOT EXISTS idx_pil_terms_id ON pil_terms(pil_terms_id);

-- Enable RLS (Row Level Security) for the tables
ALTER TABLE asset_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pil_terms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for asset_metadata
CREATE POLICY "Users can view all asset metadata" ON asset_metadata
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own asset metadata" ON asset_metadata
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own asset metadata" ON asset_metadata
    FOR UPDATE USING (auth.uid()::text = creator_address);

CREATE POLICY "Users can delete their own asset metadata" ON asset_metadata
    FOR DELETE USING (auth.uid()::text = creator_address);

-- Create RLS policies for ip_groups
CREATE POLICY "Users can view all IP groups" ON ip_groups
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own IP groups" ON ip_groups
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own IP groups" ON ip_groups
    FOR UPDATE USING (auth.uid()::text = creator_address);

CREATE POLICY "Users can delete their own IP groups" ON ip_groups
    FOR DELETE USING (auth.uid()::text = creator_address);

-- Create RLS policies for pil_terms
CREATE POLICY "Users can view all PIL terms" ON pil_terms
    FOR SELECT USING (true);

CREATE POLICY "Users can insert PIL terms" ON pil_terms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update PIL terms" ON pil_terms
    FOR UPDATE USING (true);

-- Insert default PIL terms
INSERT INTO pil_terms (pil_terms_id, name, description, commercial_use, commercial_attribution, commercial_rev_share, derivatives_allowed, derivatives_attribution, derivatives_approval, derivatives_reciprocal, territory_expansion, distribution_channels, content_restrictions) VALUES
('non-commercial', 'Non-Commercial Social Remixing', 'Allows remixing for non-commercial purposes only', false, false, 0, true, true, false, true, false, ARRAY['online', 'social'], false),
('commercial', 'Commercial Use', 'Allows commercial use with attribution', true, true, 10, true, true, false, false, false, ARRAY['online', 'social', 'print', 'broadcast'], false),
('commercial-remix', 'Commercial Remix', 'Allows commercial use and remixing', true, true, 15, true, true, false, true, false, ARRAY['online', 'social', 'print', 'broadcast'], false),
('public-domain', 'Public Domain', 'No restrictions on use', true, false, 0, true, false, false, false, false, ARRAY['online', 'social', 'print', 'broadcast', 'derivative'], false),
('attribution-only', 'Attribution Only', 'Requires attribution for any use', false, true, 0, true, true, false, false, false, ARRAY['online', 'social'], false),
('custom', 'Custom Terms', 'Custom licensing terms', false, false, 0, true, true, false, false, false, ARRAY['online'], false)
ON CONFLICT (pil_terms_id) DO NOTHING;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_ip_groups_updated_at
    BEFORE UPDATE ON ip_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for anonymous users (needed for the app to work)
GRANT SELECT, INSERT, UPDATE, DELETE ON asset_metadata TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ip_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON pil_terms TO anon;

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON asset_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ip_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pil_terms TO authenticated;

-- Grant usage on sequences if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;