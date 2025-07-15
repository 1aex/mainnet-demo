import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const isConfigured = supabaseUrl && 
         supabaseKey && 
         supabaseUrl !== 'your_supabase_url_here' &&
         supabaseKey !== 'your_supabase_anon_key_here' &&
         supabaseUrl.startsWith('https://') &&
         supabaseUrl.includes('supabase.co')
  
  if (!isConfigured) {
    console.error('Supabase configuration check failed:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlValid: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('supabase.co'),
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
      keyLength: supabaseKey?.length || 0
    })
  }
  
  return isConfigured
}

let supabase: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'story-protocol-minting'
        }
      }
    })
    console.log('Supabase client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    supabase = null
  }
} else {
  console.error('Supabase not configured - check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' }
  }

  try {
    const { error } = await supabase.from('asset_metadata').select('count', { count: 'exact', head: true })
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test storage bucket access by listing files
export const testStorageBucket = async (bucketName: string = 'assets'): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' }
  }

  try {
    // Try to list files in the bucket instead of getting bucket info
    const { error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 })
    
    if (error) {
      return { success: false, error: `Storage bucket '${bucketName}' error: ${error.message}` }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown storage error' }
  }
}

export { supabase }

export interface IPGroupRow {
  id?: string
  created_at?: string
  updated_at?: string
  group_id: string
  name: string
  description?: string
  creator_address?: string
  group_metadata?: Record<string, unknown>
  member_count?: number
  creation_tx_hash?: string
  network?: string
}

export interface PILTermsRow {
  id?: string
  created_at?: string
  pil_terms_id: string
  name: string
  description?: string
  commercial_use?: boolean
  commercial_attribution?: boolean
  commercializer_check?: boolean
  commercializer_check_data?: string
  commercial_rev_share?: number
  derivatives_allowed?: boolean
  derivatives_attribution?: boolean
  derivatives_approval?: boolean
  derivatives_reciprocal?: boolean
  territory_expansion?: boolean
  distribution_channels?: string[]
  content_restrictions?: boolean
  terms_metadata?: Record<string, unknown>
}

export interface AssetMetadataRow {
  id?: string
  created_at?: string
  asset_name: string
  description?: string
  external_url?: string
  image_url?: string
  file_hash?: string
  file_url?: string
  // Separate cover image and media file storage
  cover_image_url?: string
  cover_image_hash?: string
  media_file_url?: string
  media_file_hash?: string
  media_file_type?: string
  ip_metadata_uri?: string
  nft_metadata_uri?: string
  ip_metadata?: Record<string, unknown> // Store full IP metadata JSON
  nft_metadata?: Record<string, unknown> // Store full NFT metadata JSON
  token_id?: string
  ip_asset_id?: string
  creator_address?: string
  collection_name?: string
  collection_symbol?: string
  collection_description?: string
  ip_type?: string
  tags?: string[]
  attributes?: { trait_type: string; value: string }[]
  license_commercial_use?: boolean
  license_derivatives?: boolean
  license_attribution?: boolean
  license_revenue_share?: number
  public_minting?: boolean
  transaction_hash?: string
  block_number?: number
  network?: string
  pil_terms_id?: string
  group_id?: string
  license_terms_id?: string
}

export async function saveAssetMetadata(metadata: AssetMetadataRow): Promise<AssetMetadataRow> {
  if (!supabase) {
    console.warn('Supabase not configured - skipping metadata save')
    return metadata
  }

  try {
    // Create a copy of metadata, removing fields that might not exist in the database
    const { file_hash, ...metadataWithoutHash } = metadata
    
    // Try to insert with file_hash first
    const insertData = metadata
    let shouldRetryWithoutHash = false
    
    const { data, error } = await supabase
      .from('asset_metadata')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('asset_metadata table does not exist - skipping save')
        return metadata
      }
      
      // If error is about missing file_hash column, retry without it
      if (error.code === 'PGRST204' && error.message.includes('file_hash')) {
        console.warn('file_hash column not found, retrying without it')
        shouldRetryWithoutHash = true
      } else {
        console.error('Error saving asset metadata:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
    }

    if (shouldRetryWithoutHash) {
      const { data: retryData, error: retryError } = await supabase
        .from('asset_metadata')
        .insert([metadataWithoutHash])
        .select()
        .single()
        
      if (retryError) {
        console.error('Error saving asset metadata (retry without hash):', retryError)
        throw retryError
      }
      
      console.log('Asset metadata saved successfully (without file_hash):', retryData.id)
      return retryData
    }

    console.log('Asset metadata saved successfully:', data.id)
    return data
  } catch (error) {
    console.error('Error saving asset metadata:', error)
    return metadata // Return original metadata as fallback
  }
}

export async function getAssetMetadata(creatorAddress?: string): Promise<AssetMetadataRow[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty array')
    return []
  }

  let query = supabase
    .from('asset_metadata')
    .select('*')
    .order('created_at', { ascending: false })

  if (creatorAddress) {
    query = query.eq('creator_address', creatorAddress)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching asset metadata:', error)
    throw error
  }

  return data || []
}

// Get asset metadata with Story Explorer compatible format
export async function getAssetsForStoryExplorer(creatorAddress?: string): Promise<AssetMetadataRow[]> {
  const assets = await getAssetMetadata(creatorAddress)
  
  // Log assets in Story Explorer format for debugging
  assets.forEach(asset => {
    console.log(`📋 Asset ${asset.asset_name} - Story Explorer Data:`, {
      coverImage: asset.cover_image_url ? 'Present' : 'None',
      mediaFile: asset.media_file_url ? `Present (${asset.media_file_type})` : 'None',
      ipAssetId: asset.ip_asset_id,
      tokenId: asset.token_id,
      ipMetadataURI: asset.ip_metadata_uri,
      nftMetadataURI: asset.nft_metadata_uri
    })
  })
  
  return assets
}

// Enhanced query with joins for comprehensive asset data
export async function getAssetMetadataWithDetails(creatorAddress?: string): Promise<AssetMetadataRow[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty array')
    return []
  }

  let query = supabase
    .from('asset_metadata')
    .select(`
      *,
      ip_groups (
        group_id,
        name,
        description,
        member_count,
        created_at
      ),
      pil_terms (
        pil_terms_id,
        name,
        description,
        commercial_use,
        commercial_attribution,
        commercial_rev_share,
        derivatives_allowed,
        derivatives_attribution,
        derivatives_approval,
        derivatives_reciprocal,
        territory_expansion,
        distribution_channels,
        content_restrictions
      )
    `)
    .order('created_at', { ascending: false })

  if (creatorAddress) {
    query = query.eq('creator_address', creatorAddress)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching asset metadata with details:', error)
    throw error
  }

  return data || []
}

// Get all assets, groups, and PIL terms for a wallet
export async function getWalletAssets(walletAddress: string): Promise<{
  assets: AssetMetadataRow[]
  groups: IPGroupRow[]
  pilTerms: PILTermsRow[]
}> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty data')
    return { assets: [], groups: [], pilTerms: [] }
  }

  try {
    // Initialize empty results
    let assets: AssetMetadataRow[] = []
    let groups: IPGroupRow[] = []
    let pilTerms: PILTermsRow[] = []

    // Try to get assets - handle table not existing error
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('asset_metadata')
        .select('*')
        .eq('creator_address', walletAddress)
        .order('created_at', { ascending: false })

      if (assetsError) {
        if (assetsError.code === 'PGRST116' || assetsError.message.includes('relation') || assetsError.message.includes('does not exist')) {
          console.warn('asset_metadata table does not exist - returning empty assets')
        } else {
          console.error('Error fetching assets:', assetsError)
          throw assetsError
        }
      } else {
        assets = assetsData || []
      }
    } catch (tableError) {
      console.warn('asset_metadata table access failed:', tableError)
    }

    // Try to get groups - handle table not existing error
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('ip_groups')
        .select('*')
        .eq('creator_address', walletAddress)
        .order('created_at', { ascending: false })

      if (groupsError) {
        if (groupsError.code === 'PGRST116' || groupsError.message.includes('relation') || groupsError.message.includes('does not exist')) {
          console.warn('ip_groups table does not exist - returning empty groups')
        } else {
          console.error('Error fetching groups:', groupsError)
          throw groupsError
        }
      } else {
        groups = groupsData || []
      }
    } catch (tableError) {
      console.warn('ip_groups table access failed:', tableError)
    }

    // Try to get PIL terms - handle table not existing error
    const pilTermsIds = [...new Set(assets.map(asset => asset.pil_terms_id).filter(Boolean))]
    if (pilTermsIds.length > 0) {
      try {
        const { data: pilTermsData, error: pilTermsError } = await supabase
          .from('pil_terms')
          .select('*')
          .in('pil_terms_id', pilTermsIds)

        if (pilTermsError) {
          if (pilTermsError.code === 'PGRST116' || pilTermsError.message.includes('relation') || pilTermsError.message.includes('does not exist')) {
            console.warn('pil_terms table does not exist - returning empty PIL terms')
          } else {
            console.error('Error fetching PIL terms:', pilTermsError)
            throw pilTermsError
          }
        } else {
          pilTerms = pilTermsData || []
        }
      } catch (tableError) {
        console.warn('pil_terms table access failed:', tableError)
      }
    }

    return {
      assets,
      groups,
      pilTerms
    }
  } catch (error) {
    console.error('Error fetching wallet assets:', error)
    // Return empty data instead of throwing to prevent app crash
    return { assets: [], groups: [], pilTerms: [] }
  }
}

export async function updateAssetMetadata(
  id: string, 
  updates: Partial<AssetMetadataRow>
): Promise<AssetMetadataRow> {
  if (!supabase) {
    console.warn('Supabase not configured - skipping metadata update')
    return { id, ...updates } as AssetMetadataRow
  }

  const { data, error } = await supabase
    .from('asset_metadata')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating asset metadata:', error)
    throw error
  }

  return data
}

export async function deleteAssetMetadata(id: string): Promise<void> {
  if (!supabase) {
    console.warn('Supabase not configured - skipping metadata delete')
    return
  }

  const { error } = await supabase
    .from('asset_metadata')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting asset metadata:', error)
    throw error
  }
}

// Group management functions
export async function saveIPGroup(group: IPGroupRow): Promise<IPGroupRow> {
  if (!supabase) {
    console.warn('Supabase not configured - skipping group save')
    return group
  }

  try {
    const { data, error } = await supabase
      .from('ip_groups')
      .insert([group])
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('ip_groups table does not exist - skipping save')
        return group
      }
      console.error('Error saving IP group:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error saving IP group:', error)
    return group // Return original group as fallback
  }
}

export async function getIPGroups(creatorAddress?: string): Promise<IPGroupRow[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty array')
    return []
  }

  let query = supabase
    .from('ip_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (creatorAddress) {
    query = query.eq('creator_address', creatorAddress)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching IP groups:', error)
    throw error
  }

  return data || []
}

export async function getIPGroupById(groupId: string): Promise<IPGroupRow | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null')
    return null
  }

  const { data, error } = await supabase
    .from('ip_groups')
    .select('*')
    .eq('group_id', groupId)
    .single()

  if (error) {
    console.error('Error fetching IP group:', error)
    return null
  }

  return data
}

// PIL Terms management functions
export async function savePILTerms(pilTerms: PILTermsRow): Promise<PILTermsRow> {
  if (!supabase) {
    console.warn('Supabase not configured - skipping PIL terms save')
    return pilTerms
  }

  const { data, error } = await supabase
    .from('pil_terms')
    .insert([pilTerms])
    .select()
    .single()

  if (error) {
    console.error('Error saving PIL terms:', error)
    throw error
  }

  return data
}

export async function getPILTerms(): Promise<PILTermsRow[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('pil_terms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching PIL terms:', error)
    throw error
  }

  return data || []
}

export async function getPILTermsById(pilTermsId: string): Promise<PILTermsRow | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null')
    return null
  }

  const { data, error } = await supabase
    .from('pil_terms')
    .select('*')
    .eq('pil_terms_id', pilTermsId)
    .single()

  if (error) {
    console.error('Error fetching PIL terms:', error)
    return null
  }

  return data
}