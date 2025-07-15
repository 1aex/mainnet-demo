# Story Explorer Integration

This document explains how media files are stored to Supabase and how to properly retrieve them for Story Explorer integration.

## Overview

The enhanced asset form now supports:
- **Separate cover image upload**: For visual representation
- **Media file upload**: For the actual asset content (audio, video, animation, document, PDF)
- **Proper metadata storage**: Both files are stored separately in Supabase
- **Story Explorer compatibility**: Metadata is structured for easy retrieval

## File Storage Structure

### 1. Cover Image
- **Purpose**: Visual thumbnail/cover for the asset
- **Types**: JPEG, PNG, GIF, WebP
- **Size limit**: 10MB
- **Storage**: Stored in Supabase storage with hash for integrity

### 2. Media File
- **Purpose**: The actual asset content
- **Types**: Audio (MP3, WAV, OGG), Video (MP4, AVI, MOV, WebM), PDF, animations
- **Size limit**: 500MB
- **Storage**: Stored in Supabase storage with hash for integrity

## Database Schema

The `asset_metadata` table includes these fields for Story Explorer integration:

```sql
-- Original fields
image_url TEXT,
file_url TEXT,
file_hash TEXT,

-- New separate file fields
cover_image_url TEXT,
cover_image_hash TEXT,
media_file_url TEXT,
media_file_hash TEXT,
media_file_type TEXT,

-- Metadata URIs for Story Protocol
ip_metadata_uri TEXT,
nft_metadata_uri TEXT,
ip_metadata JSONB,
nft_metadata JSONB
```

## Usage Example

### 1. Minting Assets

```typescript
// In your component
const { mintAsset } = useStoryProtocol()

// The form automatically handles separate files
const metadata = {
  name: "My Asset",
  description: "Asset description",
  // ... other metadata
  mediaFiles: {
    coverImage: {
      url: "https://supabase-url/cover-image.jpg",
      hash: "sha256-hash",
      type: "image"
    },
    mediaFile: {
      url: "https://supabase-url/media-file.mp4",
      hash: "sha256-hash",
      type: "video"
    }
  }
}

await mintAsset(metadata, primaryFileUrl, primaryFileHash)
```

### 2. Retrieving Assets for Story Explorer

```typescript
import { getAssetsForStoryExplorer } from '../utils/supabase'
import { fromSupabaseToStoryExplorer } from '../utils/storyExplorerMetadata'

// Get assets in Story Explorer format
const assets = await getAssetsForStoryExplorer(walletAddress)

// Convert to Story Explorer metadata
const storyExplorerData = assets.map(asset => fromSupabaseToStoryExplorer(asset))

// Each asset now has:
// - coverImage: { url, hash, type }
// - mediaFile: { url, hash, type }
// - ipMetadataURI: for Story Protocol metadata
// - nftMetadataURI: for NFT metadata
```

### 3. Story Explorer Display Logic

```typescript
import { getDisplayUrl, getMediaType, getThumbnailUrl } from '../utils/storyExplorerMetadata'

function AssetCard({ asset }) {
  const displayUrl = getDisplayUrl(asset) // Cover image first, then media file
  const mediaType = getMediaType(asset)   // 'image', 'video', 'audio', 'mixed'
  const thumbnailUrl = getThumbnailUrl(asset) // Best thumbnail URL
  
  return (
    <div className="asset-card">
      <img src={thumbnailUrl} alt={asset.name} />
      <h3>{asset.name}</h3>
      <p>Type: {mediaType}</p>
      {asset.mediaFile && (
        <div>
          <p>Media File: {asset.mediaFile.type}</p>
          <a href={asset.mediaFile.url} target="_blank">View Media</a>
        </div>
      )}
    </div>
  )
}
```

## File Retrieval Protocol

### 1. For Display (Thumbnail)
```typescript
// Priority: Cover Image → Media File (if image/video) → Fallback
const thumbnailUrl = asset.cover_image_url || 
                    (asset.media_file_type === 'image' ? asset.media_file_url : null)
```

### 2. For Media Playback
```typescript
// Use media file URL for actual content
const mediaUrl = asset.media_file_url
const mediaType = asset.media_file_type // 'video', 'audio', 'document', etc.
```

### 3. For Story Protocol Integration
```typescript
// Use Story Protocol metadata URIs
const ipMetadata = await fetch(asset.ip_metadata_uri)
const nftMetadata = await fetch(asset.nft_metadata_uri)
```

## Story Explorer Metadata Structure

The system provides a standardized metadata structure for Story Explorer:

```typescript
interface StoryExplorerMetadata {
  name: string
  description: string
  ipAssetId: string
  tokenId: string
  creator: string
  
  coverImage?: {
    url: string
    hash: string
    type: 'image'
  }
  
  mediaFile?: {
    url: string
    hash: string
    type: string
  }
  
  license: {
    type: string
    commercial_use: boolean
    derivatives: boolean
    attribution: boolean
    revenue_share?: number
  }
  
  collection: {
    name: string
    symbol: string
    description: string
  }
  
  ipMetadataURI?: string
  nftMetadataURI?: string
  network: string
  txHash: string
  createdAt: string
}
```

## Console Logging

The system provides comprehensive logging for debugging:

```typescript
// During minting
console.log('🌟 Story Explorer Metadata Ready:', storyExplorerMetadata)

// During asset retrieval  
console.log('📋 Asset My Asset - Story Explorer Data:', {
  coverImage: 'Present',
  mediaFile: 'Present (video)',
  ipAssetId: '0x123...',
  tokenId: '1',
  ipMetadataURI: 'https://ipfs.io/ipfs/...',
  nftMetadataURI: 'https://ipfs.io/ipfs/...'
})
```

## Best Practices

1. **Always provide cover image** for better visual representation
2. **Use appropriate file types** based on content (video for animations, audio for music, etc.)
3. **Verify file integrity** using the stored hash values
4. **Handle missing files gracefully** (some assets might only have cover image or media file)
5. **Use Story Protocol metadata URIs** for full metadata when needed
6. **Implement proper caching** for Supabase file URLs

## Integration Example

```typescript
// Complete integration example
import { useStoryProtocol } from '../hooks/useStoryProtocol'
import { getAssetsForStoryExplorer } from '../utils/supabase'
import { fromSupabaseToStoryExplorer, getDisplayUrl } from '../utils/storyExplorerMetadata'

function StoryExplorerPage() {
  const { address } = useAccount()
  const [assets, setAssets] = useState([])
  
  useEffect(() => {
    async function loadAssets() {
      if (address) {
        const supabaseAssets = await getAssetsForStoryExplorer(address)
        const storyExplorerAssets = supabaseAssets.map(fromSupabaseToStoryExplorer)
        setAssets(storyExplorerAssets)
      }
    }
    loadAssets()
  }, [address])
  
  return (
    <div className="story-explorer">
      <h1>My Story Protocol Assets</h1>
      <div className="assets-grid">
        {assets.map(asset => (
          <div key={asset.ipAssetId} className="asset-card">
            <img src={getDisplayUrl(asset)} alt={asset.name} />
            <h3>{asset.name}</h3>
            <p>{asset.description}</p>
            <div className="asset-files">
              {asset.coverImage && (
                <div>Cover: <a href={asset.coverImage.url}>View</a></div>
              )}
              {asset.mediaFile && (
                <div>Media ({asset.mediaFile.type}): <a href={asset.mediaFile.url}>View</a></div>
              )}
            </div>
            <div className="metadata-links">
              {asset.ipMetadataURI && (
                <a href={asset.ipMetadataURI} target="_blank">IP Metadata</a>
              )}
              {asset.nftMetadataURI && (
                <a href={asset.nftMetadataURI} target="_blank">NFT Metadata</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

This system provides a complete solution for storing media files to Supabase and retrieving them in a Story Explorer-compatible format, with proper separation of cover images and media files, comprehensive metadata, and easy integration APIs.