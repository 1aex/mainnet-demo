import React from 'react'
import type { AssetMetadata } from '../utils/storyProtocol'
import { getIPFSUrl } from '../utils/ipfs'

interface Asset {
  ipAssetId: string
  tokenId: string
  metadata: AssetMetadata
  fileCid: string
  txHash?: string
}

interface AssetListProps {
  assets: Asset[]
  loading?: boolean
}

const AssetList: React.FC<AssetListProps> = ({ assets, loading = false }) => {
  if (loading) {
    return (
      <div className="asset-list loading">
        <div className="spinner"></div>
        <p>Loading assets...</p>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="asset-list empty">
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No assets minted yet</h3>
          <p>Start by uploading and minting your first IP asset</p>
        </div>
      </div>
    )
  }

  const getFileTypeFromMetadata = (metadata: AssetMetadata) => {
    // First check if we have ipType in metadata (this is set by our improved metadata)
    if (metadata.ipType) {
      return metadata.ipType
    }
    
    // Fallback to checking image URL or other indicators
    const imageUrl = metadata.image || ''
    if (imageUrl.includes('image') || imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.gif')) return 'image'
    if (imageUrl.includes('audio') || imageUrl.includes('.mp3') || imageUrl.includes('.wav')) return 'audio'
    if (imageUrl.includes('video') || imageUrl.includes('.mp4') || imageUrl.includes('.webm')) return 'video'
    if (imageUrl.includes('pdf') || imageUrl.includes('.pdf')) return 'document'
    
    // Check attributes for media type
    const mediaType = metadata.attributes?.find(attr => attr.trait_type === 'Media Type')?.value
    if (mediaType) {
      if (mediaType.startsWith('image/')) return 'image'
      if (mediaType.startsWith('audio/')) return 'audio'
      if (mediaType.startsWith('video/')) return 'video'
      if (mediaType.includes('pdf')) return 'document'
    }
    
    return 'file'
  }

  const renderAssetPreview = (asset: Asset) => {
    const fileType = getFileTypeFromMetadata(asset.metadata)
    const ipfsUrl = getIPFSUrl(asset.fileCid)
    
    // Use metadata image for preview if available, otherwise use the file itself
    const previewUrl = asset.metadata.image || ipfsUrl

    switch (fileType) {
      case 'image':
        return (
          <img
            src={previewUrl}
            alt={asset.metadata.name}
            className="asset-preview-image"
            onError={(e) => {
              // Fallback to IPFS URL if preview image fails
              const target = e.currentTarget as HTMLImageElement
              if (target.src !== ipfsUrl) {
                target.src = ipfsUrl
              } else {
                target.style.display = 'none'
              }
            }}
          />
        )
      case 'audio':
        return (
          <div className="asset-preview-audio">
            {asset.metadata.image && (
              <img
                src={asset.metadata.image}
                alt={asset.metadata.name}
                className="audio-cover-art"
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
            )}
            <div className="file-icon">🎵</div>
            <audio controls style={{ width: '100%' }}>
              <source src={ipfsUrl} type="audio/mpeg" />
              <source src={ipfsUrl} type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )
      case 'video':
        return (
          <div className="asset-preview-video">
            <video controls width="100%" height="200" poster={asset.metadata.image}>
              <source src={ipfsUrl} type="video/mp4" />
              <source src={ipfsUrl} type="video/webm" />
              Your browser does not support video playback.
            </video>
          </div>
        )
      case 'document':
        return (
          <div className="asset-preview-document">
            {asset.metadata.image && (
              <img
                src={asset.metadata.image}
                alt={asset.metadata.name}
                className="document-preview"
                style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'cover' }}
              />
            )}
            <div className="file-icon">📄</div>
            <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="document-link">
              View Document
            </a>
          </div>
        )
      default:
        return (
          <div className="asset-preview-file">
            <div className="file-icon">📁</div>
            <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">
              Download File
            </a>
          </div>
        )
    }
  }

  return (
    <div className="asset-list">
      <h2>Your IP Assets</h2>
      <div className="assets-grid">
        {assets.map((asset, index) => (
          <div key={index} className="asset-card">
            <div className="asset-preview">
              {renderAssetPreview(asset)}
            </div>
            
            <div className="asset-details">
              <h3 className="asset-name">{asset.metadata.name}</h3>
              {asset.metadata.description && (
                <p className="asset-description">{asset.metadata.description}</p>
              )}
              
              <div className="asset-meta">
                <div className="meta-item">
                  <label>IP Asset ID:</label>
                  <span className="truncate">{asset.ipAssetId}</span>
                </div>
                <div className="meta-item">
                  <label>Token ID:</label>
                  <span>{asset.tokenId}</span>
                </div>
                {asset.metadata.ipType && (
                  <div className="meta-item">
                    <label>Type:</label>
                    <span className="ip-type-badge">{asset.metadata.ipType}</span>
                  </div>
                )}
                {asset.metadata.creator && (
                  <div className="meta-item">
                    <label>Creator:</label>
                    <span className="truncate">{asset.metadata.creator}</span>
                  </div>
                )}
                {asset.metadata.collection && (
                  <div className="meta-item">
                    <label>Collection:</label>
                    <span>{asset.metadata.collection.name} ({asset.metadata.collection.symbol})</span>
                  </div>
                )}
                {asset.txHash && (
                  <div className="meta-item">
                    <label>Transaction Hash:</label>
                    <span 
                      className="truncate transaction-hash clickable"
                      title={`Click to view transaction ${asset.txHash} on Story Explorer`}
                      onClick={() => window.open(`https://explorer.story.foundation/tx/${asset.txHash}`, '_blank')}
                      style={{ cursor: 'pointer', color: '#007bff' }}
                    >
                      {asset.txHash}
                    </span>
                  </div>
                )}
                <div className="meta-item">
                  <label>IPFS CID:</label>
                  <span className="truncate">{asset.fileCid}</span>
                </div>
              </div>

              {asset.metadata.tags && asset.metadata.tags.length > 0 && (
                <div className="asset-tags">
                  <h4>Tags</h4>
                  <div className="tags-list">
                    {asset.metadata.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {asset.metadata.license && (
                <div className="asset-license">
                  <h4>License Terms</h4>
                  <div className="license-terms">
                    <div className="license-item">
                      <span className={`license-badge ${asset.metadata.license.commercial_use ? 'allowed' : 'restricted'}`}>
                        Commercial Use: {asset.metadata.license.commercial_use ? 'Allowed' : 'Restricted'}
                      </span>
                    </div>
                    <div className="license-item">
                      <span className={`license-badge ${asset.metadata.license.derivatives ? 'allowed' : 'restricted'}`}>
                        Derivatives: {asset.metadata.license.derivatives ? 'Allowed' : 'Restricted'}
                      </span>
                    </div>
                    <div className="license-item">
                      <span className={`license-badge ${asset.metadata.license.attribution ? 'required' : 'optional'}`}>
                        Attribution: {asset.metadata.license.attribution ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {asset.metadata.attributes.length > 0 && (
                <div className="asset-attributes">
                  <h4>Attributes</h4>
                  <div className="attributes-list">
                    {asset.metadata.attributes.map((attr, attrIndex) => (
                      <div key={attrIndex} className="attribute">
                        <span className="trait-type">{attr.trait_type}:</span>
                        <span className="trait-value">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="asset-actions">
                <a
                  href={getIPFSUrl(asset.fileCid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn"
                >
                  View on IPFS
                </a>
                <a
                  href={`https://explorer.story.foundation/ipa/${asset.ipAssetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn story-explorer"
                  title={`View IP Asset ${asset.ipAssetId} on Story Explorer`}
                >
                  <span className="btn-icon">🌟</span>
                  Story Explorer
                </a>
                {asset.txHash && (
                  <a
                    href={`https://explorer.story.foundation/tx/${asset.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn secondary"
                    title={`View transaction ${asset.txHash} on Story Explorer`}
                  >
                    <span className="btn-icon">🔍</span>
                    Transaction
                  </a>
                )}
                {asset.metadata.external_url && (
                  <a
                    href={asset.metadata.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn"
                  >
                    External Link
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AssetList