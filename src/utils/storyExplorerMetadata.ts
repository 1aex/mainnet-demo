import type { AssetMetadata } from './storyProtocol'
import type { AssetMetadataRow } from './supabase'

// Helper functions to construct proper metadata for Story Explorer retrieval

export interface StoryExplorerMetadata {
  // Core asset information
  name: string
  description: string
  ipAssetId: string
  tokenId: string
  creator: string
  
  // File references
  coverImage?: {
    url: string
    hash: string
    type: 'image'
  }
  mediaFile?: {
    url: string
    hash: string
    type: string
    mimeType?: string
  }
  
  // Metadata URIs
  ipMetadataURI?: string
  nftMetadataURI?: string
  
  // License information
  license: {
    type: string
    commercial_use: boolean
    derivatives: boolean
    attribution: boolean
    revenue_share?: number
  }
  
  // Collection information
  collection: {
    name: string
    symbol: string
    description: string
  }
  
  // Enhanced metadata
  ipMetadata?: Record<string, unknown>
  nftMetadata?: Record<string, unknown>
  
  // Storage information
  network: string
  txHash: string
  createdAt: string
}

/**
 * Convert AssetMetadata to Story Explorer compatible format
 */
export function toStoryExplorerMetadata(
  metadata: AssetMetadata,
  result: {
    ipAssetId: string
    tokenId: string
    txHash: string
    ipMetadataURI?: string
    nftMetadataURI?: string
    storyMetadata?: {
      ipMetadata?: Record<string, unknown>
      nftMetadata?: Record<string, unknown>
    }
  }
): StoryExplorerMetadata {
  return {
    name: metadata.name,
    description: metadata.description,
    ipAssetId: result.ipAssetId,
    tokenId: result.tokenId,
    creator: metadata.creator || 'Unknown',
    
    coverImage: metadata.mediaFiles?.coverImage,
    mediaFile: metadata.mediaFiles?.mediaFile,
    
    ipMetadataURI: result.ipMetadataURI,
    nftMetadataURI: result.nftMetadataURI,
    
    license: metadata.license || {
      type: 'Unknown',
      commercial_use: false,
      derivatives: false,
      attribution: false
    },
    
    collection: metadata.collection || {
      name: 'Unknown Collection',
      symbol: 'UNK',
      description: ''
    },
    
    ipMetadata: result.storyMetadata?.ipMetadata,
    nftMetadata: result.storyMetadata?.nftMetadata,
    
    network: 'Story Protocol',
    txHash: result.txHash,
    createdAt: new Date().toISOString()
  }
}

/**
 * Convert Supabase row to Story Explorer compatible format
 */
export function fromSupabaseToStoryExplorer(row: AssetMetadataRow): StoryExplorerMetadata {
  return {
    name: row.asset_name,
    description: row.description || '',
    ipAssetId: row.ip_asset_id || '',
    tokenId: row.token_id || '',
    creator: row.creator_address || 'Unknown',
    
    coverImage: row.cover_image_url ? {
      url: row.cover_image_url,
      hash: row.cover_image_hash || '',
      type: 'image'
    } : undefined,
    
    mediaFile: row.media_file_url ? {
      url: row.media_file_url,
      hash: row.media_file_hash || '',
      type: row.media_file_type || 'unknown'
    } : undefined,
    
    ipMetadataURI: row.ip_metadata_uri,
    nftMetadataURI: row.nft_metadata_uri,
    
    license: {
      type: 'Unknown', // Could be derived from PIL terms
      commercial_use: row.license_commercial_use || false,
      derivatives: row.license_derivatives || false,
      attribution: row.license_attribution || false,
      revenue_share: row.license_revenue_share
    },
    
    collection: {
      name: row.collection_name || 'Unknown Collection',
      symbol: row.collection_symbol || 'UNK',
      description: row.collection_description || ''
    },
    
    ipMetadata: row.ip_metadata as Record<string, unknown>,
    nftMetadata: row.nft_metadata as Record<string, unknown>,
    
    network: row.network || 'Story Protocol',
    txHash: row.transaction_hash || '',
    createdAt: row.created_at || new Date().toISOString()
  }
}

/**
 * Get display URL for Story Explorer
 * Returns cover image if available, otherwise media file URL
 */
export function getDisplayUrl(metadata: StoryExplorerMetadata): string {
  return metadata.coverImage?.url || metadata.mediaFile?.url || ''
}

/**
 * Get media type for Story Explorer display
 */
export function getMediaType(metadata: StoryExplorerMetadata): string {
  if (metadata.coverImage && metadata.mediaFile) {
    return 'mixed' // Has both cover image and media file
  }
  if (metadata.coverImage) {
    return 'image'
  }
  if (metadata.mediaFile) {
    return metadata.mediaFile.type
  }
  return 'unknown'
}

/**
 * Check if asset has video content
 */
export function hasVideoContent(metadata: StoryExplorerMetadata): boolean {
  return metadata.mediaFile?.type === 'video' || false
}

/**
 * Check if asset has audio content
 */
export function hasAudioContent(metadata: StoryExplorerMetadata): boolean {
  return metadata.mediaFile?.type === 'audio' || false
}

/**
 * Get appropriate thumbnail URL for Story Explorer
 */
export function getThumbnailUrl(metadata: StoryExplorerMetadata): string {
  // Use cover image as thumbnail if available
  if (metadata.coverImage) {
    return metadata.coverImage.url
  }
  
  // For video/audio, try to use the media file as thumbnail
  // (Story Explorer should handle video thumbnails)
  if (metadata.mediaFile && ['video', 'image'].includes(metadata.mediaFile.type)) {
    return metadata.mediaFile.url
  }
  
  return ''
}

/**
 * Build Story Explorer compatible metadata object
 */
export function buildStoryExplorerMetadata(
  metadata: AssetMetadata,
  mintResult: {
    ipAssetId: string
    tokenId: string
    txHash: string
    ipMetadataURI?: string
    nftMetadataURI?: string
    storyMetadata?: {
      ipMetadata?: Record<string, unknown>
      nftMetadata?: Record<string, unknown>
    }
  }
): StoryExplorerMetadata {
  const explorerMetadata = toStoryExplorerMetadata(metadata, mintResult)
  
  // Log the metadata for debugging
  console.log('📊 Story Explorer Metadata:', {
    name: explorerMetadata.name,
    ipAssetId: explorerMetadata.ipAssetId,
    tokenId: explorerMetadata.tokenId,
    coverImage: explorerMetadata.coverImage ? 'Present' : 'None',
    mediaFile: explorerMetadata.mediaFile ? `Present (${explorerMetadata.mediaFile.type})` : 'None',
    displayUrl: getDisplayUrl(explorerMetadata),
    mediaType: getMediaType(explorerMetadata),
    hasVideo: hasVideoContent(explorerMetadata),
    hasAudio: hasAudioContent(explorerMetadata)
  })
  
  return explorerMetadata
}