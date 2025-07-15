import React, { useEffect, useState } from 'react'
import type { AssetMetadata } from '../utils/storyProtocol'
import type { AssetMetadataRow, IPGroupRow, PILTermsRow } from '../utils/supabase'
import { getSupabaseThumbnailUrl, isSupabaseStorageUrl } from '../utils/supabaseStorage'

interface LocalAsset {
  ipAssetId: string
  tokenId: string
  metadata: AssetMetadata
  fileUrl: string
  fileHash: string
}

interface AssetListWithSupabaseProps {
  localAssets: LocalAsset[]
  supabaseAssets: AssetMetadataRow[]
  walletGroups?: IPGroupRow[]
  walletPILTerms?: PILTermsRow[]
  loading?: boolean
  onLoadSupabaseAssets?: () => void
}

const AssetListWithSupabase: React.FC<AssetListWithSupabaseProps> = ({ 
  localAssets, 
  supabaseAssets, 
  walletGroups = [],
  walletPILTerms = [],
  loading = false, 
  onLoadSupabaseAssets 
}) => {
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({})
  
  useEffect(() => {
    if (onLoadSupabaseAssets) {
      onLoadSupabaseAssets()
    }
  }, [onLoadSupabaseAssets])
  
  const handleImageError = (assetId: string, error: boolean) => {
    setImageErrors(prev => ({ ...prev, [assetId]: error }))
    setImageLoading(prev => ({ ...prev, [assetId]: false }))
  }
  
  const handleImageLoad = (assetId: string) => {
    setImageLoading(prev => ({ ...prev, [assetId]: false }))
    setImageErrors(prev => ({ ...prev, [assetId]: false }))
  }
  
  const handleImageLoadStart = (assetId: string) => {
    setImageLoading(prev => ({ ...prev, [assetId]: true }))
  }

  if (loading) {
    return (
      <div className="asset-list loading">
        <div className="spinner"></div>
        <p>Loading assets...</p>
      </div>
    )
  }

  // Combine and deduplicate assets, prioritizing Supabase data
  const allAssets = [...supabaseAssets]
  const supabaseTokenIds = new Set(supabaseAssets.map(asset => asset.token_id))
  
  // Add local assets that aren't in Supabase yet
  localAssets.forEach(localAsset => {
    if (!supabaseTokenIds.has(localAsset.tokenId)) {
      allAssets.push({
        asset_name: localAsset.metadata.name,
        description: localAsset.metadata.description,
        external_url: localAsset.metadata.external_url,
        image_url: localAsset.metadata.image,
        file_url: localAsset.fileUrl,
        file_hash: localAsset.fileHash,
        token_id: localAsset.tokenId,
        ip_asset_id: localAsset.ipAssetId,
        creator_address: localAsset.metadata.creator,
        collection_name: localAsset.metadata.collection?.name,
        collection_symbol: localAsset.metadata.collection?.symbol,
        collection_description: localAsset.metadata.collection?.description,
        ip_type: localAsset.metadata.ipType,
        tags: localAsset.metadata.tags,
        attributes: localAsset.metadata.attributes,
        license_commercial_use: localAsset.metadata.license?.commercial_use,
        license_derivatives: localAsset.metadata.license?.derivatives,
        license_attribution: localAsset.metadata.license?.attribution,
        license_revenue_share: localAsset.metadata.license?.revenue_share,
        public_minting: localAsset.metadata.collection?.public_minting,
      })
    }
  })

  if (allAssets.length === 0) {
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

  const getFileTypeFromUrl = (imageUrl?: string) => {
    if (!imageUrl) return 'file'
    
    // Check file extension or MIME type patterns
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac']
    const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
    const pdfExts = ['.pdf']
    
    const urlLower = imageUrl.toLowerCase()
    
    if (imageExts.some(ext => urlLower.includes(ext)) || urlLower.includes('image')) return 'image'
    if (audioExts.some(ext => urlLower.includes(ext)) || urlLower.includes('audio')) return 'audio'
    if (videoExts.some(ext => urlLower.includes(ext)) || urlLower.includes('video')) return 'video'
    if (pdfExts.some(ext => urlLower.includes(ext)) || urlLower.includes('pdf')) return 'pdf'
    
    return 'file'
  }
  
  const getOptimizedImageUrl = (imageUrl: string, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    if (!imageUrl) return ''
    
    console.log('getOptimizedImageUrl called with:', { imageUrl, size })
    
    // If it's a Supabase storage URL, use our thumbnail utility
    if (isSupabaseStorageUrl(imageUrl)) {
      console.log('Using Supabase thumbnail utility')
      return getSupabaseThumbnailUrl(imageUrl, size)
    }
    
    // For other URLs (IPFS, etc.), return as-is
    console.log('Returning original URL for non-Supabase URL')
    return imageUrl
  }

  const renderAssetPreview = (asset: AssetMetadataRow, imageError: boolean, setImageError: (error: boolean) => void, isLoading: boolean = false) => {
    // Prioritize new file structure: cover image first, then media file, then fallback to legacy fields
    const displayUrl = asset.cover_image_url || asset.media_file_url || asset.image_url || asset.file_url || ''
    const fileType = asset.media_file_type || getFileTypeFromUrl(displayUrl)
    const fileUrl = displayUrl
    const optimizedImageUrl = getOptimizedImageUrl(fileUrl, 'medium')
    const thumbnailUrl = getOptimizedImageUrl(fileUrl, 'small')
    const assetId = asset.id || asset.ip_asset_id || ''
    
    // Debug logging
    console.log('Asset preview rendering:', {
      assetName: asset.asset_name,
      fileType,
      displayUrl,
      coverImageUrl: asset.cover_image_url,
      mediaFileUrl: asset.media_file_url,
      mediaFileType: asset.media_file_type,
      optimizedUrl: optimizedImageUrl,
      thumbnailUrl,
      isSupabaseUrl: isSupabaseStorageUrl(fileUrl)
    })

    switch (fileType) {
      case 'image':
        return (
          <div className="asset-preview-container">
            {isLoading && (
              <div className="image-loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
            {!imageError ? (
              <>
                <img
                  src={thumbnailUrl}
                  alt={asset.asset_name}
                  className="asset-preview-image"
                  onError={() => {
                    console.error('Image failed to load:', thumbnailUrl)
                    handleImageError(assetId, true)
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', thumbnailUrl)
                    handleImageLoad(assetId)
                  }}
                  onLoadStart={() => handleImageLoadStart(assetId)}
                  loading="lazy"
                  style={{ opacity: isLoading ? 0.5 : 1 }}
                />
              </>
            ) : (
              <div className="asset-preview-fallback">
                <div className="file-icon">🖼️</div>
                <span className="file-type">Image</span>
                <span className="file-name">{asset.asset_name}</span>
                <div className="fallback-info">
                  <small>Original URL: {fileUrl}</small>
                  <small>Thumbnail URL: {thumbnailUrl}</small>
                </div>
                <button 
                  className="retry-image-btn"
                  onClick={() => {
                    console.log('Retrying image load for:', { assetId, fileUrl, thumbnailUrl })
                    setImageError(false)
                    handleImageLoadStart(assetId)
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            <div className="asset-preview-overlay">
              <div className="preview-actions">
                <button 
                  className="preview-btn"
                  onClick={() => window.open(optimizedImageUrl, '_blank')}
                >
                  View Full Size
                </button>
                {isSupabaseStorageUrl(fileUrl) && (
                  <button 
                    className="preview-btn secondary"
                    onClick={() => window.open(getOptimizedImageUrl(fileUrl, 'large'), '_blank')}
                  >
                    HD Quality
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      case 'audio':
        return (
          <div className="asset-preview-container">
            <div className="asset-preview-media">
              <div className="file-icon large">🎵</div>
              <div className="media-info">
                <span className="file-type">Audio</span>
                <span className="file-name">{asset.asset_name}</span>
              </div>
            </div>
            <div className="media-controls">
              <audio controls className="audio-player">
                <source src={fileUrl} />
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="asset-preview-container">
            <video controls className="video-player">
              <source src={fileUrl} />
              Your browser does not support video playback.
            </video>
            <div className="asset-preview-overlay">
              <div className="preview-actions">
                <button 
                  className="preview-btn"
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        )
      case 'pdf':
        return (
          <div className="asset-preview-container">
            <div className="asset-preview-media">
              <div className="file-icon large">📄</div>
              <div className="media-info">
                <span className="file-type">PDF Document</span>
                <span className="file-name">{asset.asset_name}</span>
              </div>
            </div>
            <div className="preview-actions">
              <button 
                className="preview-btn primary"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                View PDF
              </button>
            </div>
          </div>
        )
      default:
        return (
          <div className="asset-preview-container">
            <div className="asset-preview-media">
              <div className="file-icon large">📁</div>
              <div className="media-info">
                <span className="file-type">File</span>
                <span className="file-name">{asset.asset_name}</span>
              </div>
            </div>
            <div className="preview-actions">
              <button 
                className="preview-btn primary"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                Download File
              </button>
            </div>
          </div>
        )
    }
  }

  // Helper function to get group details
  const getGroupInfo = (groupId?: string) => {
    if (!groupId) return null
    return walletGroups.find(group => group.group_id === groupId)
  }

  // Helper function to get PIL terms details
  const getPILTermsInfo = (pilTermsId?: string) => {
    if (!pilTermsId) return null
    return walletPILTerms.find(terms => terms.pil_terms_id === pilTermsId)
  }

  return (
    <div className="asset-list">
      <div className="assets-header">
        <h2>Your IP Assets ({allAssets.length})</h2>
        {walletGroups.length > 0 && (
          <div className="groups-summary">
            <h4>Your Groups ({walletGroups.length})</h4>
            <div className="groups-list">
              {walletGroups.map(group => (
                <div key={group.group_id} className="group-item">
                  <span className="group-name">{group.name}</span>
                  <span className="group-members">({group.member_count || 0} members)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="assets-grid">
        {allAssets.map((asset, index) => {
          const groupInfo = getGroupInfo(asset.group_id)
          const pilTermsInfo = getPILTermsInfo(asset.pil_terms_id)
          
          return (
            <div key={asset.id || index} className="asset-card">
              <div className="asset-preview">
                {renderAssetPreview(
                  asset, 
                  imageErrors[asset.id || index] || false, 
                  (error) => handleImageError(asset.id || index.toString(), error),
                  imageLoading[asset.id || index] || false
                )}
              </div>
              
              <div className="asset-card-body">
                <div className="asset-header">
                  <h3 className="asset-name">{asset.asset_name}</h3>
                  {asset.ip_type && (
                    <span className="ip-type-badge">{asset.ip_type}</span>
                  )}
                </div>
                {asset.description && (
                  <p className="asset-description">{asset.description}</p>
                )}
                
                <div className="asset-quick-info">
                  {asset.token_id && (
                    <div className="quick-info-item">
                      <span className="info-label">Token ID</span>
                      <span className="info-value">#{asset.token_id}</span>
                    </div>
                  )}
                  {asset.creator_address && (
                    <div className="quick-info-item">
                      <span className="info-label">Creator</span>
                      <span className="info-value truncate">{asset.creator_address}</span>
                    </div>
                  )}
                  {asset.created_at && (
                    <div className="quick-info-item">
                      <span className="info-label">Created</span>
                      <span className="info-value">{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Group Information */}
                {groupInfo && (
                  <div className="asset-group-info">
                    <h4>📁 Group</h4>
                    <div className="group-badge">
                      <span className="group-badge-name">{groupInfo.name}</span>
                      <span className="group-badge-members">({groupInfo.member_count || 0} members)</span>
                    </div>
                    {groupInfo.description && (
                      <p className="group-description">{groupInfo.description}</p>
                    )}
                  </div>
                )}

                {/* PIL Terms Information */}
                {pilTermsInfo && (
                  <div className="asset-pil-terms">
                    <h4>⚖️ PIL Terms</h4>
                    <div className="pil-terms-info">
                      <div className="pil-terms-name">{pilTermsInfo.name}</div>
                      {pilTermsInfo.description && (
                        <p className="pil-terms-description">{pilTermsInfo.description}</p>
                      )}
                      <div className="pil-terms-details">
                        <div className="pil-term-item">
                          <span className={`pil-badge ${pilTermsInfo.commercial_use ? 'allowed' : 'restricted'}`}>
                            Commercial Use: {pilTermsInfo.commercial_use ? 'Allowed' : 'Restricted'}
                          </span>
                        </div>
                        <div className="pil-term-item">
                          <span className={`pil-badge ${pilTermsInfo.derivatives_allowed ? 'allowed' : 'restricted'}`}>
                            Derivatives: {pilTermsInfo.derivatives_allowed ? 'Allowed' : 'Restricted'}
                          </span>
                        </div>
                        {pilTermsInfo.commercial_rev_share && pilTermsInfo.commercial_rev_share > 0 && (
                          <div className="pil-term-item">
                            <span className="pil-badge revenue-share">
                              Revenue Share: {pilTermsInfo.commercial_rev_share}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="asset-meta">
                {asset.ip_asset_id && (
                  <div className="meta-item">
                    <label>IP Asset ID:</label>
                    <span className="truncate">{asset.ip_asset_id}</span>
                  </div>
                )}
                {asset.token_id && (
                  <div className="meta-item">
                    <label>Token ID:</label>
                    <span>{asset.token_id}</span>
                  </div>
                )}
                {asset.ip_type && (
                  <div className="meta-item">
                    <label>Type:</label>
                    <span className="ip-type-badge">{asset.ip_type}</span>
                  </div>
                )}
                {asset.creator_address && (
                  <div className="meta-item">
                    <label>Creator:</label>
                    <span className="truncate">{asset.creator_address}</span>
                  </div>
                )}
                {asset.collection_name && (
                  <div className="meta-item">
                    <label>Collection:</label>
                    <span>{asset.collection_name} {asset.collection_symbol && `(${asset.collection_symbol})`}</span>
                  </div>
                )}
                {asset.file_hash && (
                  <div className="meta-item">
                    <label>File Hash:</label>
                    <span className="truncate">{asset.file_hash}</span>
                  </div>
                )}
                {asset.network && (
                  <div className="meta-item">
                    <label>Network:</label>
                    <span>{asset.network}</span>
                  </div>
                )}
                {asset.transaction_hash && (
                  <div className="meta-item">
                    <label>Transaction Hash:</label>
                    <span 
                      className="truncate transaction-hash clickable"
                      title={`Click to view transaction ${asset.transaction_hash} on Story Explorer`}
                      onClick={() => window.open(`https://explorer.story.foundation/tx/${asset.transaction_hash}`, '_blank')}
                      style={{ cursor: 'pointer', color: '#007bff' }}
                    >
                      {asset.transaction_hash}
                    </span>
                  </div>
                )}
              </div>

              {asset.tags && asset.tags.length > 0 && (
                <div className="asset-tags">
                  <h4 className="section-title">Tags</h4>
                  <div className="tags-container">
                    {asset.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(asset.license_commercial_use !== undefined || 
                asset.license_derivatives !== undefined || 
                asset.license_attribution !== undefined) && (
                <div className="asset-license">
                  <h4>License Terms</h4>
                  <div className="license-terms">
                    {asset.license_commercial_use !== undefined && (
                      <div className="license-item">
                        <span className={`license-badge ${asset.license_commercial_use ? 'allowed' : 'restricted'}`}>
                          Commercial Use: {asset.license_commercial_use ? 'Allowed' : 'Restricted'}
                        </span>
                      </div>
                    )}
                    {asset.license_derivatives !== undefined && (
                      <div className="license-item">
                        <span className={`license-badge ${asset.license_derivatives ? 'allowed' : 'restricted'}`}>
                          Derivatives: {asset.license_derivatives ? 'Allowed' : 'Restricted'}
                        </span>
                      </div>
                    )}
                    {asset.license_attribution !== undefined && (
                      <div className="license-item">
                        <span className={`license-badge ${asset.license_attribution ? 'required' : 'optional'}`}>
                          Attribution: {asset.license_attribution ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    )}
                    {asset.license_revenue_share !== undefined && (
                      <div className="license-item">
                        <span className="license-badge">
                          Revenue Share: {asset.license_revenue_share}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {asset.attributes && asset.attributes.length > 0 && (
                <div className="asset-attributes">
                  <h4 className="section-title">Attributes</h4>
                  <div className="attributes-grid">
                    {asset.attributes.map((attr, attrIndex) => (
                      <div key={attrIndex} className="attribute-card">
                        <div className="attribute-label">{attr.trait_type}</div>
                        <div className="attribute-value">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="asset-footer">
                <div className="asset-actions">
                  {asset.cover_image_url && (
                    <button
                      onClick={() => window.open(asset.cover_image_url, '_blank')}
                      className="action-btn primary"
                    >
                      <span className="btn-icon">🖼️</span>
                      Cover Image
                    </button>
                  )}
                  {asset.media_file_url && (
                    <button
                      onClick={() => window.open(asset.media_file_url, '_blank')}
                      className="action-btn primary"
                    >
                      <span className="btn-icon">🎬</span>
                      Media File
                    </button>
                  )}
                  {!asset.cover_image_url && !asset.media_file_url && asset.file_url && (
                    <button
                      onClick={() => window.open(asset.file_url, '_blank')}
                      className="action-btn primary"
                    >
                      <span className="btn-icon">📄</span>
                      View File
                    </button>
                  )}
                  {asset.external_url && (
                    <button
                      onClick={() => window.open(asset.external_url, '_blank')}
                      className="action-btn secondary"
                    >
                      <span className="btn-icon">🔗</span>
                      External
                    </button>
                  )}
                  {asset.transaction_hash && (
                    <button
                      onClick={() => window.open(`https://explorer.story.foundation/tx/${asset.transaction_hash}`, '_blank')}
                      className="action-btn secondary"
                      title={`View transaction ${asset.transaction_hash} on Story Explorer`}
                    >
                      <span className="btn-icon">🔍</span>
                      Transaction
                    </button>
                  )}
                  {asset.ip_asset_id && (
                    <button
                      onClick={() => window.open(`https://explorer.story.foundation/ipa/${asset.ip_asset_id}`, '_blank')}
                      className="action-btn story-explorer"
                      title={`View IP Asset ${asset.ip_asset_id} on Story Explorer`}
                    >
                      <span className="btn-icon">🌟</span>
                      Story Explorer
                    </button>
                  )}
                </div>
                
                {asset.created_at && (
                  <div className="asset-timestamp">
                    <small>Created {new Date(asset.created_at).toLocaleDateString()}</small>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AssetListWithSupabase