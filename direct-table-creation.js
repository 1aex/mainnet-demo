import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqbagygoqcprrlgredod.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYmFneWdvcWNwcnJsZ3JlZG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjUyNjYsImV4cCI6MjA2NzA0MTI2Nn0.Z-u3q0xBqxQk8luK3TgfL5yj-Iqe1ZkBqIp45CoWX5M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTablesDirectly() {
  console.log('🚀 Creating tables directly in Supabase...')
  
  try {
    // First, let's try to create the asset_metadata table by inserting a test record
    console.log('\n1️⃣ Creating asset_metadata table...')
    
    const testAsset = {
      asset_name: 'Test Asset',
      description: 'Test description',
      creator_address: '0x0000000000000000000000000000000000000000',
      network: 'Story Protocol'
    }
    
    const { data: assetData, error: assetError } = await supabase
      .from('asset_metadata')
      .insert([testAsset])
      .select()
    
    if (assetError) {
      console.log('❌ asset_metadata table does not exist:', assetError.message)
      console.log('Creating via SQL...')
      
      // Try creating via RPC call
      const { data: createAssetTable, error: createAssetError } = await supabase
        .rpc('create_asset_metadata_table')
      
      if (createAssetError) {
        console.log('❌ Cannot create asset_metadata table via RPC:', createAssetError.message)
      } else {
        console.log('✅ asset_metadata table created via RPC')
      }
    } else {
      console.log('✅ asset_metadata table exists and test record inserted')
      
      // Clean up test record
      await supabase
        .from('asset_metadata')
        .delete()
        .eq('asset_name', 'Test Asset')
    }
    
    // Try creating ip_groups table
    console.log('\n2️⃣ Creating ip_groups table...')
    
    const testGroup = {
      group_id: 'test-group-123',
      name: 'Test Group',
      description: 'Test group description',
      creator_address: '0x0000000000000000000000000000000000000000',
      member_count: 0,
      network: 'Story Protocol'
    }
    
    const { data: groupData, error: groupError } = await supabase
      .from('ip_groups')
      .insert([testGroup])
      .select()
    
    if (groupError) {
      console.log('❌ ip_groups table does not exist:', groupError.message)
    } else {
      console.log('✅ ip_groups table exists and test record inserted')
      
      // Clean up test record
      await supabase
        .from('ip_groups')
        .delete()
        .eq('group_id', 'test-group-123')
    }
    
    // Try creating pil_terms table
    console.log('\n3️⃣ Creating pil_terms table...')
    
    const testPILTerm = {
      pil_terms_id: 'test-terms',
      name: 'Test Terms',
      description: 'Test PIL terms',
      commercial_use: false,
      derivatives_allowed: true
    }
    
    const { data: pilData, error: pilError } = await supabase
      .from('pil_terms')
      .insert([testPILTerm])
      .select()
    
    if (pilError) {
      console.log('❌ pil_terms table does not exist:', pilError.message)
    } else {
      console.log('✅ pil_terms table exists and test record inserted')
      
      // Clean up test record
      await supabase
        .from('pil_terms')
        .delete()
        .eq('pil_terms_id', 'test-terms')
    }
    
    console.log('\n📋 Summary:')
    console.log('Since we cannot create tables programmatically with the anon key,')
    console.log('you need to create them manually via the Supabase SQL Editor.')
    console.log('\nGo to: https://supabase.com/dashboard/project/wqbagygoqcprrlgredod/sql')
    console.log('And run the SQL schema provided.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTablesDirectly()