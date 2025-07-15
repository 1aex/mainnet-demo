import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://cbgqjdrwffppgxbnsvds.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3FqZHJ3ZmZwcGd4Ym5zdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDM2NDIsImV4cCI6MjA2Mjc3OTY0Mn0.9jEd0YrX8huojN96XOVNfGNjweH_mdJPJcWt3o7RJoM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('Creating Supabase tables...')

  try {
    // Create asset_metadata table
    console.log('1. Creating asset_metadata table...')
    const { data: assetData, error: assetError } = await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE IF NOT EXISTS asset_metadata (
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
      );` 
    })
    
    if (assetError) {
      console.error('Error creating asset_metadata table:', assetError)
    } else {
      console.log('✓ asset_metadata table created')
    }

    // Create ip_groups table
    console.log('2. Creating ip_groups table...')
    const { data: groupsData, error: groupsError } = await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE IF NOT EXISTS ip_groups (
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
      );` 
    })
    
    if (groupsError) {
      console.error('Error creating ip_groups table:', groupsError)
    } else {
      console.log('✓ ip_groups table created')
    }

    // Create pil_terms table
    console.log('3. Creating pil_terms table...')
    const { data: pilData, error: pilError } = await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE IF NOT EXISTS pil_terms (
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
      );` 
    })
    
    if (pilError) {
      console.error('Error creating pil_terms table:', pilError)
    } else {
      console.log('✓ pil_terms table created')
    }

    // Create indexes
    console.log('4. Creating indexes...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_asset_metadata_creator ON asset_metadata(creator_address);',
      'CREATE INDEX IF NOT EXISTS idx_asset_metadata_ip_asset_id ON asset_metadata(ip_asset_id);',
      'CREATE INDEX IF NOT EXISTS idx_asset_metadata_token_id ON asset_metadata(token_id);',
      'CREATE INDEX IF NOT EXISTS idx_asset_metadata_created_at ON asset_metadata(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_ip_groups_creator ON ip_groups(creator_address);',
      'CREATE INDEX IF NOT EXISTS idx_ip_groups_group_id ON ip_groups(group_id);',
      'CREATE INDEX IF NOT EXISTS idx_pil_terms_id ON pil_terms(pil_terms_id);'
    ]

    for (const indexSQL of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL })
      if (error) {
        console.error('Error creating index:', error)
      }
    }
    console.log('✓ Indexes created')

    // Insert default PIL terms
    console.log('5. Inserting default PIL terms...')
    const { data: insertData, error: insertError } = await supabase.rpc('exec_sql', { 
      sql: `INSERT INTO pil_terms (pil_terms_id, name, description, commercial_use, commercial_attribution, commercial_rev_share, derivatives_allowed, derivatives_attribution, derivatives_approval, derivatives_reciprocal, territory_expansion, distribution_channels, content_restrictions) VALUES
        ('non-commercial', 'Non-Commercial Social Remixing', 'Allows remixing for non-commercial purposes only', false, false, 0, true, true, false, true, false, ARRAY['online', 'social'], false),
        ('commercial', 'Commercial Use', 'Allows commercial use with attribution', true, true, 10, true, true, false, false, false, ARRAY['online', 'social', 'print', 'broadcast'], false),
        ('commercial-remix', 'Commercial Remix', 'Allows commercial use and remixing', true, true, 15, true, true, false, true, false, ARRAY['online', 'social', 'print', 'broadcast'], false),
        ('public-domain', 'Public Domain', 'No restrictions on use', true, false, 0, true, false, false, false, false, ARRAY['online', 'social', 'print', 'broadcast', 'derivative'], false),
        ('attribution-only', 'Attribution Only', 'Requires attribution for any use', false, true, 0, true, true, false, false, false, ARRAY['online', 'social'], false),
        ('custom', 'Custom Terms', 'Custom licensing terms', false, false, 0, true, true, false, false, false, ARRAY['online'], false)
      ON CONFLICT (pil_terms_id) DO NOTHING;` 
    })
    
    if (insertError) {
      console.error('Error inserting default PIL terms:', insertError)
    } else {
      console.log('✓ Default PIL terms inserted')
    }

    console.log('\n🎉 All tables created successfully!')
    console.log('You can now use the Story Protocol minting application with full database support.')
    
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

// Run the table creation
createTables()
  .then(() => {
    console.log('Database setup complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Database setup failed:', error)
    process.exit(1)
  })