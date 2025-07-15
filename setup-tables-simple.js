import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cbgqjdrwffppgxbnsvds.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZ3FqZHJ3ZmZwcGd4Ym5zdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDM2NDIsImV4cCI6MjA2Mjc3OTY0Mn0.9jEd0YrX8huojN96XOVNfGNjweH_mdJPJcWt3o7RJoM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Auth error:', error)
    } else {
      console.log('✓ Connected to Supabase successfully')
    }
    
    // Try to create the tables using individual insert operations
    await createTablesManually()
    
  } catch (error) {
    console.error('Connection failed:', error)
  }
}

async function createTablesManually() {
  console.log('Creating tables manually...')
  
  // Since we can't execute raw SQL directly, let's try to insert default PIL terms
  // to see if the tables already exist
  
  try {
    console.log('Checking if tables exist by trying to insert default PIL terms...')
    
    const pilTermsData = [
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
    
    const { data, error } = await supabase
      .from('pil_terms')
      .upsert(pilTermsData, { onConflict: 'pil_terms_id' })
      .select()
    
    if (error) {
      console.error('Error accessing pil_terms table:', error)
      console.log('\n❌ Tables do not exist. You need to create them manually.')
      console.log('Please copy the SQL from supabase-schema.sql and run it in your Supabase SQL Editor.')
      console.log('Go to: https://cbgqjdrwffppgxbnsvds.supabase.co/project/cbgqjdrwffppgxbnsvds/sql')
    } else {
      console.log('✓ PIL terms table exists and populated with default values')
      console.log(`Inserted/updated ${data.length} PIL terms`)
    }
    
    // Test asset_metadata table
    console.log('Testing asset_metadata table...')
    const { data: assetTest, error: assetError } = await supabase
      .from('asset_metadata')
      .select('id')
      .limit(1)
    
    if (assetError) {
      console.error('Error accessing asset_metadata table:', assetError)
    } else {
      console.log('✓ asset_metadata table exists')
    }
    
    // Test ip_groups table
    console.log('Testing ip_groups table...')
    const { data: groupTest, error: groupError } = await supabase
      .from('ip_groups')
      .select('id')
      .limit(1)
    
    if (groupError) {
      console.error('Error accessing ip_groups table:', groupError)
    } else {
      console.log('✓ ip_groups table exists')
    }
    
  } catch (error) {
    console.error('Error testing tables:', error)
  }
}

console.log('Story Protocol Supabase Setup')
console.log('=============================')
console.log('Supabase URL:', supabaseUrl)
console.log('Connecting...\n')

testConnection()
  .then(() => {
    console.log('\n📋 Next Steps:')
    console.log('1. If tables don\'t exist, go to your Supabase SQL Editor:')
    console.log('   https://cbgqjdrwffppgxbnsvds.supabase.co/project/cbgqjdrwffppgxbnsvds/sql')
    console.log('2. Copy and paste the contents of supabase-schema.sql')
    console.log('3. Run the SQL to create all tables, indexes, and default data')
    console.log('4. Your Story Protocol minting app will then work with full database support!')
  })
  .catch(error => {
    console.error('Setup failed:', error)
    process.exit(1)
  })