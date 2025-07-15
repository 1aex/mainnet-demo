import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqbagygoqcprrlgredod.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYmFneWdvcWNwcnJsZ3JlZG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjUyNjYsImV4cCI6MjA2NzA0MTI2Nn0.Z-u3q0xBqxQk8luK3TgfL5yj-Iqe1ZkBqIp45CoWX5M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyTables() {
  console.log('🔍 Verifying Supabase tables...')
  console.log('URL:', supabaseUrl)
  console.log('')
  
  try {
    // Test asset_metadata table
    console.log('1️⃣ Testing asset_metadata table...')
    const { data: assetData, error: assetError } = await supabase
      .from('asset_metadata')
      .select('*')
      .limit(1)
    
    if (assetError) {
      console.log('❌ asset_metadata table:', assetError.message)
    } else {
      console.log('✅ asset_metadata table exists and accessible')
    }
    
    // Test ip_groups table
    console.log('\n2️⃣ Testing ip_groups table...')
    const { data: groupsData, error: groupsError } = await supabase
      .from('ip_groups')
      .select('*')
      .limit(1)
    
    if (groupsError) {
      console.log('❌ ip_groups table:', groupsError.message)
    } else {
      console.log('✅ ip_groups table exists and accessible')
    }
    
    // Test pil_terms table
    console.log('\n3️⃣ Testing pil_terms table...')
    const { data: pilData, error: pilError } = await supabase
      .from('pil_terms')
      .select('*')
      .limit(10)
    
    if (pilError) {
      console.log('❌ pil_terms table:', pilError.message)
    } else {
      console.log('✅ pil_terms table exists and accessible')
      console.log(`📊 Found ${pilData.length} PIL terms:`)
      pilData.forEach(term => {
        console.log(`   - ${term.name} (${term.pil_terms_id})`)
      })
    }
    
    console.log('\n🎉 Verification complete!')
    
    if (!assetError && !groupsError && !pilError) {
      console.log('✅ All tables are working correctly!')
      console.log('Your Story Protocol minting app is ready to use.')
    } else {
      console.log('❌ Some tables are missing. Please run the SQL schema in Supabase.')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

verifyTables()