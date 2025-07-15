import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqbagygoqcprrlgredod.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYmFneWdvcWNwcnJsZ3JlZG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjUyNjYsImV4cCI6MjA2NzA0MTI2Nn0.Z-u3q0xBqxQk8luK3TgfL5yj-Iqe1ZkBqIp45CoWX5M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🚀 Creating Supabase tables for Story Protocol Minting...')
  console.log('Using new Supabase instance:', supabaseUrl)
  
  try {
    // Create asset_metadata table
    console.log('\n1️⃣ Creating asset_metadata table...')
    const { data: assetData, error: assetError } = await supabase
      .from('asset_metadata')
      .select('*')
      .limit(1)

    if (assetError && assetError.code === 'PGRST116') {
      console.log('Table does not exist, need to create it manually via SQL Editor')
    } else if (assetError) {
      console.log('Table may not exist:', assetError.message)
    } else {
      console.log('✅ asset_metadata table already exists')
    }

    // Create ip_groups table  
    console.log('\n2️⃣ Creating ip_groups table...')
    const { data: groupsData, error: groupsError } = await supabase
      .from('ip_groups')
      .select('*')
      .limit(1)

    if (groupsError && groupsError.code === 'PGRST116') {
      console.log('Table does not exist, need to create it manually via SQL Editor')
    } else if (groupsError) {
      console.log('Table may not exist:', groupsError.message)
    } else {
      console.log('✅ ip_groups table already exists')
    }

    // Create pil_terms table
    console.log('\n3️⃣ Creating pil_terms table...')
    const { data: pilData, error: pilError } = await supabase
      .from('pil_terms')
      .select('*')
      .limit(1)

    if (pilError && pilError.code === 'PGRST116') {
      console.log('Table does not exist, need to create it manually via SQL Editor')
    } else if (pilError) {
      console.log('Table may not exist:', pilError.message)
    } else {
      console.log('✅ pil_terms table already exists')
      
      // If pil_terms exists, try to populate it with default data
      await populateDefaultPILTerms()
    }

    console.log('\n📋 Next Steps:')
    console.log('If tables don\'t exist, please go to Supabase SQL Editor and run the schema:')
    console.log('URL:', supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/'))
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function populateDefaultPILTerms() {
  console.log('🔄 Populating default PIL terms...')
  
  const defaultTerms = [
    {
      pil_terms_id: 'non-commercial',
      name: 'Non-Commercial Social Remixing', 
      description: 'Allows remixing for non-commercial purposes only',
      commercial_use: false,
      commercial_attribution: false,
      commercial_rev_share: 0,
      derivatives_allowed: true,
      derivatives_attribution: true,
      derivatives_approval: false,
      derivatives_reciprocal: true,
      territory_expansion: false,
      distribution_channels: ['online', 'social'],
      content_restrictions: false
    },
    {
      pil_terms_id: 'commercial',
      name: 'Commercial Use',
      description: 'Allows commercial use with attribution',
      commercial_use: true,
      commercial_attribution: true, 
      commercial_rev_share: 10,
      derivatives_allowed: true,
      derivatives_attribution: true,
      derivatives_approval: false,
      derivatives_reciprocal: false,
      territory_expansion: false,
      distribution_channels: ['online', 'social', 'print', 'broadcast'],
      content_restrictions: false
    },
    {
      pil_terms_id: 'commercial-remix',
      name: 'Commercial Remix',
      description: 'Allows commercial use and remixing',
      commercial_use: true,
      commercial_attribution: true,
      commercial_rev_share: 15,
      derivatives_allowed: true,
      derivatives_attribution: true,
      derivatives_approval: false,
      derivatives_reciprocal: true,
      territory_expansion: false,
      distribution_channels: ['online', 'social', 'print', 'broadcast'],
      content_restrictions: false
    },
    {
      pil_terms_id: 'public-domain',
      name: 'Public Domain',
      description: 'No restrictions on use',
      commercial_use: true,
      commercial_attribution: false,
      commercial_rev_share: 0,
      derivatives_allowed: true,
      derivatives_attribution: false,
      derivatives_approval: false,
      derivatives_reciprocal: false,
      territory_expansion: false,
      distribution_channels: ['online', 'social', 'print', 'broadcast', 'derivative'],
      content_restrictions: false
    },
    {
      pil_terms_id: 'attribution-only',
      name: 'Attribution Only',
      description: 'Requires attribution for any use',
      commercial_use: false,
      commercial_attribution: true,
      commercial_rev_share: 0,
      derivatives_allowed: true,
      derivatives_attribution: true,
      derivatives_approval: false,
      derivatives_reciprocal: false,
      territory_expansion: false,
      distribution_channels: ['online', 'social'],
      content_restrictions: false
    },
    {
      pil_terms_id: 'custom',
      name: 'Custom Terms',
      description: 'Custom licensing terms',
      commercial_use: false,
      commercial_attribution: false,
      commercial_rev_share: 0,
      derivatives_allowed: true,
      derivatives_attribution: true,
      derivatives_approval: false,
      derivatives_reciprocal: false,
      territory_expansion: false,
      distribution_channels: ['online'],
      content_restrictions: false
    }
  ]

  try {
    const { data, error } = await supabase
      .from('pil_terms')
      .upsert(defaultTerms, { onConflict: 'pil_terms_id' })
      .select()

    if (error) {
      console.error('❌ Error inserting PIL terms:', error)
    } else {
      console.log(`✅ Successfully populated ${data.length} PIL terms`)
    }
  } catch (error) {
    console.error('❌ Error populating PIL terms:', error)
  }
}

createTables()