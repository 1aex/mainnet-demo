import React, { useState, useEffect } from 'react'
import FileUpload from './FileUpload'
import type { AssetMetadata, IPGroup } from '../utils/storyProtocol'
import { DEFAULT_PIL_TERMS, IP_ARTIFACT_TYPES } from '../constants/pilTerms'
import type { IPArtifactType } from '../constants/pilTerms'
import { getIPGroups, saveIPGroup } from '../utils/supabase'
import type { IPGroupRow } from '../utils/supabase'
import { useAccount } from 'wagmi'

interface EnhancedAssetFormProps {
  onSubmit: (metadata: AssetMetadata, fileUrl: string, fileHash: string) => void
  loading?: boolean
}

const EnhancedAssetForm: React.FC<EnhancedAssetFormProps> = ({ onSubmit, loading = false }) => {
  const { address } = useAccount()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    externalUrl: '',
    attributes: [{ trait_type: '', value: '' }],
    ipType: 'image' as IPArtifactType,
    tags: '',
    // Collection details
    collectionName: 'Story IP Assets',
    collectionSymbol: 'SIA',
    collectionDescription: '',
    publicMinting: true,
    // PIL Terms
    selectedPILTerms: 'non-commercial',
    customPILTerms: {
      commercialUse: false,
      commercialAttribution: false,
      commercialRevShare: 0,
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: false,
      territoryExpansion: false,
      contentRestrictions: false
    },
    // Group selection
    groupOption: 'none' as 'none' | 'existing' | 'new',
    selectedGroupId: '',
    newGroupName: '',
    newGroupDescription: '',
    // NFT Metadata fields
    nftMetadata: {
      animationUrl: '',
      backgroundColor: '',
      youtubeUrl: ''
    },
    // IP Metadata fields
    ipMetadata: {
      title: '',
      creatorName: '',
      creatorAddress: '',
      contributionPercent: 100,
      createdAt: new Date().toISOString(),
      mediaType: '',
      thumbnailUrl: '',
      parentIpIds: '',
      rootIpIds: ''
    }
  })

  const [coverImageUrl, setCoverImageUrl] = useState<string>('')
  const [coverImageHash, setCoverImageHash] = useState<string>('')
  const [mediaFileUrl, setMediaFileUrl] = useState<string>('')
  const [mediaFileHash, setMediaFileHash] = useState<string>('')
  const [availableGroups, setAvailableGroups] = useState<IPGroupRow[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [showAdvancedMetadata, setShowAdvancedMetadata] = useState(false)

  // Load available groups when component mounts
  useEffect(() => {
    if (address) {
      loadGroups()
    }
  }, [address])

  const loadGroups = async () => {
    if (!address) return
    
    setLoadingGroups(true)
    try {
      const groups = await getIPGroups(address)
      setAvailableGroups(groups)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNestedInputChange = (section: 'nftMetadata' | 'ipMetadata', field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  // Function to provide default values for missing metadata fields
  const getMetadataDefaults = (metadata: AssetMetadata): AssetMetadata => {
    return {
      ...metadata,
      nftMetadata: {
        animation_url: metadata.nftMetadata?.animation_url || undefined,
        background_color: metadata.nftMetadata?.background_color || undefined,
        youtube_url: metadata.nftMetadata?.youtube_url || undefined,
        ...metadata.nftMetadata
      },
      ipMetadata: {
        title: metadata.ipMetadata?.title || metadata.name || '',
        creatorName: metadata.ipMetadata?.creatorName || 'Anonymous',
        creatorAddress: metadata.ipMetadata?.creatorAddress || address || '',
        contributionPercent: metadata.ipMetadata?.contributionPercent || 100,
        mediaType: metadata.ipMetadata?.mediaType || 'mixed',
        thumbnailUrl: metadata.ipMetadata?.thumbnailUrl || coverImageUrl || mediaFileUrl || '',
        parentIpIds: metadata.ipMetadata?.parentIpIds || [],
        rootIpIds: metadata.ipMetadata?.rootIpIds || [],
        createdAt: metadata.ipMetadata?.createdAt || new Date().toISOString(),
        ...metadata.ipMetadata
      }
    }
  }

  const handlePILTermsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTerms = DEFAULT_PIL_TERMS.find(terms => terms.id === e.target.value)
    if (selectedTerms) {
      setFormData(prev => ({
        ...prev,
        selectedPILTerms: e.target.value,
        customPILTerms: {
          commercialUse: selectedTerms.commercialUse,
          commercialAttribution: selectedTerms.commercialAttribution,
          commercialRevShare: selectedTerms.commercialRevShare,
          derivativesAllowed: selectedTerms.derivativesAllowed,
          derivativesAttribution: selectedTerms.derivativesAttribution,
          derivativesApproval: selectedTerms.derivativesApproval,
          derivativesReciprocal: selectedTerms.derivativesReciprocal,
          territoryExpansion: selectedTerms.territoryExpansion,
          contentRestrictions: selectedTerms.contentRestrictions
        }
      }))
    }
  }

  const handleCustomPILChange = (field: string, value: boolean | number) => {
    setFormData(prev => ({
      ...prev,
      customPILTerms: {
        ...prev.customPILTerms,
        [field]: value
      }
    }))
  }

  const handleAttributeChange = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...formData.attributes]
    newAttributes[index][field] = value
    setFormData(prev => ({
      ...prev,
      attributes: newAttributes
    }))
  }

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }))
  }

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const errors: string[] = []
    
    // Required fields validation
    if (!formData.name.trim()) {
      errors.push('Asset name is required')
    }
    
    if (!formData.description.trim()) {
      errors.push('Description is required')
    }
    
    if (!coverImageUrl && !mediaFileUrl) {
      errors.push('Please upload either a cover image or media file')
    }
    
    if (!formData.ipType) {
      errors.push('IP artifact type is required')
    }
    
    if (!formData.selectedPILTerms) {
      errors.push('PIL terms selection is required')
    }
    
    if (!formData.collectionName.trim()) {
      errors.push('Collection name is required')
    }
    
    if (!formData.collectionSymbol.trim()) {
      errors.push('Collection symbol is required')
    }
    
    // Group validation
    if (formData.groupOption === 'new' && !formData.newGroupName.trim()) {
      errors.push('Group name is required when creating a new group')
    }
    
    if (formData.groupOption === 'existing' && !formData.selectedGroupId) {
      errors.push('Please select an existing group')
    }
    
    // Custom PIL terms validation
    if (formData.selectedPILTerms === 'custom') {
      if (formData.customPILTerms.commercialUse && formData.customPILTerms.commercialRevShare < 0) {
        errors.push('Commercial revenue share must be 0 or greater')
      }
      if (formData.customPILTerms.commercialRevShare > 100) {
        errors.push('Commercial revenue share cannot exceed 100%')
      }
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
      return
    }

    try {
      let selectedGroup: IPGroup | undefined
      
      // Handle group creation/selection
      if (formData.groupOption === 'new' && formData.newGroupName && address) {
        const groupData: IPGroupRow = {
          group_id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          name: formData.newGroupName,
          description: formData.newGroupDescription,
          creator_address: address,
          member_count: 0,
          network: 'Story Protocol'
        }
        
        const savedGroup = await saveIPGroup(groupData)
        selectedGroup = {
          id: savedGroup.group_id,
          name: savedGroup.name,
          description: savedGroup.description || '',
          created_at: savedGroup.created_at,
          creator_address: savedGroup.creator_address,
          member_count: savedGroup.member_count || 0
        }
      } else if (formData.groupOption === 'existing' && formData.selectedGroupId) {
        const existingGroup = availableGroups.find(g => g.group_id === formData.selectedGroupId)
        if (existingGroup) {
          selectedGroup = {
            id: existingGroup.group_id,
            name: existingGroup.name,
            description: existingGroup.description || '',
            created_at: existingGroup.created_at,
            creator_address: existingGroup.creator_address,
            member_count: existingGroup.member_count || 0
          }
        }
      }

      // Get selected PIL terms
      const selectedPILTerms = DEFAULT_PIL_TERMS.find(terms => terms.id === formData.selectedPILTerms) || DEFAULT_PIL_TERMS[0]

      // Auto-detect media type from uploaded files
      const detectMediaType = () => {
        if (mediaFileUrl) {
          // Extract file extension or detect from filename
          const mediaFileName = mediaFileUrl.split('/').pop() || ''
          const extension = mediaFileName.split('.').pop()?.toLowerCase()
          
          if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension || '')) return 'video'
          if (['mp3', 'wav', 'ogg', 'flac'].includes(extension || '')) return 'audio'
          if (['pdf'].includes(extension || '')) return 'document'
          if (['gif', 'svg'].includes(extension || '')) return 'image'
        }
        if (coverImageUrl) return 'image'
        return 'mixed'
      }

      // Create metadata object with enhanced NFT and IP metadata
      const rawMetadata: AssetMetadata = {
        name: formData.name,
        description: formData.description,
        image: coverImageUrl || mediaFileUrl, // Use cover image first, then media file
        external_url: formData.externalUrl || undefined,
        attributes: formData.attributes.filter(attr => attr.trait_type && attr.value),
        ipType: formData.ipType,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        license: {
          type: selectedPILTerms.name,
          commercial_use: formData.customPILTerms.commercialUse,
          derivatives: formData.customPILTerms.derivativesAllowed,
          attribution: formData.customPILTerms.derivativesAttribution,
          revenue_share: formData.customPILTerms.commercialRevShare
        },
        pilTerms: selectedPILTerms,
        group: selectedGroup,
        collection: {
          name: formData.collectionName,
          symbol: formData.collectionSymbol,
          description: formData.collectionDescription,
          public_minting: formData.publicMinting
        },
        // Enhanced metadata fields
        creator: formData.ipMetadata.creatorName || address,
        creationDate: formData.ipMetadata.createdAt,
        // Store enhanced metadata for later use
        nftMetadata: {
          animation_url: mediaFileUrl && detectMediaType() === 'video' ? mediaFileUrl : (formData.nftMetadata.animationUrl || undefined),
          background_color: formData.nftMetadata.backgroundColor || undefined,
          youtube_url: formData.nftMetadata.youtubeUrl || undefined
        },
        ipMetadata: {
          title: formData.ipMetadata.title || formData.name,
          creatorName: formData.ipMetadata.creatorName || 'Anonymous',
          creatorAddress: address || formData.ipMetadata.creatorAddress,
          contributionPercent: formData.ipMetadata.contributionPercent || 100,
          mediaType: detectMediaType(),
          thumbnailUrl: coverImageUrl || mediaFileUrl,
          parentIpIds: formData.ipMetadata.parentIpIds ? formData.ipMetadata.parentIpIds.split(',').map(id => id.trim()).filter(id => id) : [],
          rootIpIds: formData.ipMetadata.rootIpIds ? formData.ipMetadata.rootIpIds.split(',').map(id => id.trim()).filter(id => id) : [],
          createdAt: formData.ipMetadata.createdAt
        },
        // Add media file references for Story Explorer
        mediaFiles: {
          coverImage: coverImageUrl ? {
            url: coverImageUrl,
            hash: coverImageHash,
            type: 'image'
          } : undefined,
          mediaFile: mediaFileUrl ? {
            url: mediaFileUrl,
            hash: mediaFileHash,
            type: detectMediaType()
          } : undefined
        }
      }

      // Apply defaults for any missing fields
      const metadata = getMetadataDefaults(rawMetadata)

      onSubmit(metadata, coverImageUrl || mediaFileUrl, coverImageHash || mediaFileHash)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        externalUrl: '',
        attributes: [{ trait_type: '', value: '' }],
        ipType: 'image',
        tags: '',
        collectionName: 'Story IP Assets',
        collectionSymbol: 'SIA',
        collectionDescription: '',
        publicMinting: true,
        selectedPILTerms: 'non-commercial',
        customPILTerms: {
          commercialUse: false,
          commercialAttribution: false,
          commercialRevShare: 0,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesApproval: false,
          derivativesReciprocal: false,
          territoryExpansion: false,
          contentRestrictions: false
        },
        groupOption: 'none',
        selectedGroupId: '',
        newGroupName: '',
        newGroupDescription: '',
        nftMetadata: {
          animationUrl: '',
          backgroundColor: '',
          youtubeUrl: ''
        },
        ipMetadata: {
          title: '',
          creatorName: '',
          creatorAddress: address || '',
          contributionPercent: 100,
          createdAt: new Date().toISOString(),
          mediaType: '',
          thumbnailUrl: '',
          parentIpIds: '',
          rootIpIds: ''
        }
      })
      setCoverImageUrl('')
      setCoverImageHash('')
      setMediaFileUrl('')
      setMediaFileHash('')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    }
  }

  const selectedPILTermsData = DEFAULT_PIL_TERMS.find(terms => terms.id === formData.selectedPILTerms)

  return (
    <div className="asset-form">
      <form onSubmit={handleSubmit}>
        {/* Cover Image Upload Section */}
        <div className="form-section">
          <h3>🖼️ Cover Image</h3>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>Upload a cover image for your asset (recommended for better visibility)</p>
          <FileUpload
            onFileUploaded={(url, _, hash) => {
              setCoverImageUrl(url)
              setCoverImageHash(hash)
            }}
            acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
            maxSize={10}
          />
          {coverImageUrl && (
            <div style={{ marginTop: '10px' }}>
              <img src={coverImageUrl} alt="Cover preview" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          )}
        </div>

        {/* Media File Upload Section */}
        <div className="form-section">
          <h3>📁 Media File</h3>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>Upload your main media file (audio, video, animation, document, or PDF)</p>
          <FileUpload
            onFileUploaded={(url, _, hash) => {
              setMediaFileUrl(url)
              setMediaFileHash(hash)
            }}
            acceptedTypes={[
              'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
              'video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/webm', 'video/mkv',
              'application/pdf',
              'image/gif', 'image/svg+xml'
            ]}
            maxSize={500}
          />
          {!coverImageUrl && !mediaFileUrl && (
            <small style={{ color: '#ff6b6b', marginTop: '8px', display: 'block' }}>Either cover image or media file is required</small>
          )}
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3>📝 Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Asset Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter asset name"
              style={{ borderColor: !formData.name.trim() ? '#ff6b6b' : '' }}
            />
            {!formData.name.trim() && <small style={{ color: '#ff6b6b' }}>Asset name is required</small>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your asset"
              rows={3}
              required
              style={{ borderColor: !formData.description.trim() ? '#ff6b6b' : '' }}
            />
            {!formData.description.trim() && <small style={{ color: '#ff6b6b' }}>Description is required</small>}
          </div>

          <div className="form-group">
            <label htmlFor="externalUrl">External URL</label>
            <input
              type="url"
              id="externalUrl"
              name="externalUrl"
              value={formData.externalUrl}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ipType">IP Artifact Type *</label>
            <select
              id="ipType"
              name="ipType"
              value={formData.ipType}
              onChange={handleInputChange}
              required
            >
              {IP_ARTIFACT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="art, music, digital (comma separated)"
            />
          </div>
        </div>

        {/* Advanced Metadata Toggle */}
        <div className="form-section">
          <button
            type="button"
            onClick={() => setShowAdvancedMetadata(!showAdvancedMetadata)}
            className="metadata-toggle-btn"
            style={{
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span>{showAdvancedMetadata ? '⬇️' : '➡️'}</span>
            <span>Advanced Metadata (Optional)</span>
          </button>
        </div>

        {showAdvancedMetadata && (
          <>
            {/* NFT Metadata Section */}
            <div className="form-section">
              <h3>🎨 NFT Metadata</h3>
              <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>Additional NFT metadata attributes (optional)</p>
          
          <div className="form-group">
            <label htmlFor="nftAnimationUrl">Animation URL</label>
            <input
              type="url"
              id="nftAnimationUrl"
              value={formData.nftMetadata.animationUrl}
              onChange={(e) => handleNestedInputChange('nftMetadata', 'animationUrl', e.target.value)}
              placeholder="https://example.com/animation.mp4"
            />
            <small className="form-help">URL to a multi-media attachment for the item</small>
          </div>

          <div className="form-group">
            <label htmlFor="nftBackgroundColor">Background Color</label>
            <input
              type="text"
              id="nftBackgroundColor"
              value={formData.nftMetadata.backgroundColor}
              onChange={(e) => handleNestedInputChange('nftMetadata', 'backgroundColor', e.target.value)}
              placeholder="#000000 or rgb(255,255,255)"
            />
            <small className="form-help">Background color for the item (hex or rgb format)</small>
          </div>

          <div className="form-group">
            <label htmlFor="nftYoutubeUrl">YouTube URL</label>
            <input
              type="url"
              id="nftYoutubeUrl"
              value={formData.nftMetadata.youtubeUrl}
              onChange={(e) => handleNestedInputChange('nftMetadata', 'youtubeUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <small className="form-help">YouTube video URL related to this NFT</small>
          </div>
        </div>

        {/* IP Metadata Section */}
        <div className="form-section">
          <h3>📋 IP Metadata</h3>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>Intellectual Property specific metadata</p>
          
          <div className="form-group">
            <label htmlFor="ipTitle">IP Title</label>
            <input
              type="text"
              id="ipTitle"
              value={formData.ipMetadata.title}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'title', e.target.value)}
              placeholder="Defaults to asset name if empty"
            />
            <small className="form-help">Title of the intellectual property (defaults to asset name if empty)</small>
          </div>

          <div className="form-group">
            <label htmlFor="creatorName">Creator Name</label>
            <input
              type="text"
              id="creatorName"
              value={formData.ipMetadata.creatorName}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'creatorName', e.target.value)}
              placeholder="Your name or pseudonym"
            />
            <small className="form-help">Name of the creator (defaults to 'Anonymous')</small>
          </div>

          <div className="form-group">
            <label htmlFor="creatorAddress">Creator Address</label>
            <input
              type="text"
              id="creatorAddress"
              value={formData.ipMetadata.creatorAddress}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'creatorAddress', e.target.value)}
              placeholder={address || 'Creator wallet address'}
              disabled
            />
            <small className="form-help">Automatically filled with connected wallet address</small>
          </div>

          <div className="form-group">
            <label htmlFor="contributionPercent">Contribution Percentage</label>
            <input
              type="number"
              id="contributionPercent"
              min="0"
              max="100"
              value={formData.ipMetadata.contributionPercent}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'contributionPercent', parseInt(e.target.value) || 100)}
              placeholder="100"
            />
            <small className="form-help">Percentage of contribution to this IP (0-100)</small>
          </div>



          <div className="form-group">
            <label htmlFor="parentIpIds">Parent IP IDs</label>
            <input
              type="text"
              id="parentIpIds"
              value={formData.ipMetadata.parentIpIds}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'parentIpIds', e.target.value)}
              placeholder="parent-id-1, parent-id-2"
            />
            <small className="form-help">Comma-separated list of parent IP IDs (if this is a derivative work)</small>
          </div>

          <div className="form-group">
            <label htmlFor="rootIpIds">Root IP IDs</label>
            <input
              type="text"
              id="rootIpIds"
              value={formData.ipMetadata.rootIpIds}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'rootIpIds', e.target.value)}
              placeholder="root-id-1, root-id-2"
            />
            <small className="form-help">Comma-separated list of root IP IDs (original source IPs)</small>
          </div>

          <div className="form-group">
            <label htmlFor="createdAt">Creation Date</label>
            <input
              type="datetime-local"
              id="createdAt"
              value={formData.ipMetadata.createdAt.slice(0, 16)}
              onChange={(e) => handleNestedInputChange('ipMetadata', 'createdAt', e.target.value + ':00.000Z')}
            />
            <small className="form-help">Date and time when this IP was created</small>
          </div>
        </div>
          </>
        )}

        {/* PIL Terms Section */}
        <div className="form-section">
          <h3>⚖️ License Terms (PIL)</h3>
          
          <div className="form-group">
            <label htmlFor="selectedPILTerms">PIL Terms Template</label>
            <select
              id="selectedPILTerms"
              name="selectedPILTerms"
              value={formData.selectedPILTerms}
              onChange={handlePILTermsChange}
            >
              {DEFAULT_PIL_TERMS.map(terms => (
                <option key={terms.id} value={terms.id}>
                  {terms.name}
                </option>
              ))}
            </select>
            {selectedPILTermsData && (
              <small className="form-help">{selectedPILTermsData.description}</small>
            )}
          </div>

          {formData.selectedPILTerms === 'custom' && (
            <div className="custom-pil-terms">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.customPILTerms.commercialUse}
                    onChange={(e) => handleCustomPILChange('commercialUse', e.target.checked)}
                  />
                  Allow Commercial Use
                </label>
              </div>
              
              {formData.customPILTerms.commercialUse && (
                <div className="form-group">
                  <label htmlFor="commercialRevShare">Commercial Revenue Share (%)</label>
                  <input
                    type="number"
                    id="commercialRevShare"
                    min="0"
                    max="100"
                    value={formData.customPILTerms.commercialRevShare}
                    onChange={(e) => handleCustomPILChange('commercialRevShare', parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.customPILTerms.derivativesAllowed}
                    onChange={(e) => handleCustomPILChange('derivativesAllowed', e.target.checked)}
                  />
                  Allow Derivatives
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.customPILTerms.derivativesAttribution}
                    onChange={(e) => handleCustomPILChange('derivativesAttribution', e.target.checked)}
                  />
                  Require Attribution
                </label>
              </div>
            </div>
          )}

          <div className="pil-terms-preview">
            <h4>License Summary</h4>
            <div className="license-badges">
              <span className={`license-badge ${selectedPILTermsData?.commercialUse ? 'allowed' : 'restricted'}`}>
                Commercial Use: {selectedPILTermsData?.commercialUse ? 'Allowed' : 'Restricted'}
              </span>
              <span className={`license-badge ${selectedPILTermsData?.derivativesAllowed ? 'allowed' : 'restricted'}`}>
                Derivatives: {selectedPILTermsData?.derivativesAllowed ? 'Allowed' : 'Restricted'}
              </span>
              <span className={`license-badge ${selectedPILTermsData?.derivativesAttribution ? 'required' : 'optional'}`}>
                Attribution: {selectedPILTermsData?.derivativesAttribution ? 'Required' : 'Optional'}
              </span>
              {selectedPILTermsData?.commercialRevShare && selectedPILTermsData.commercialRevShare > 0 && (
                <span className="license-badge">
                  Revenue Share: {selectedPILTermsData.commercialRevShare}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Group Selection */}
        <div className="form-section">
          <h3>👥 IP Group</h3>
          
          <div className="form-group">
            <label>Group Option</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="groupOption"
                  value="none"
                  checked={formData.groupOption === 'none'}
                  onChange={handleInputChange}
                />
                No Group
              </label>
              <label>
                <input
                  type="radio"
                  name="groupOption"
                  value="existing"
                  checked={formData.groupOption === 'existing'}
                  onChange={handleInputChange}
                />
                Add to Existing Group
              </label>
              <label>
                <input
                  type="radio"
                  name="groupOption"
                  value="new"
                  checked={formData.groupOption === 'new'}
                  onChange={handleInputChange}
                />
                Create New Group
              </label>
            </div>
          </div>

          {formData.groupOption === 'existing' && (
            <div className="form-group">
              <label htmlFor="selectedGroupId">Select Group</label>
              <select
                id="selectedGroupId"
                name="selectedGroupId"
                value={formData.selectedGroupId}
                onChange={handleInputChange}
                disabled={loadingGroups}
              >
                <option value="">Select a group...</option>
                {availableGroups.map(group => (
                  <option key={group.group_id} value={group.group_id}>
                    {group.name} ({group.member_count || 0} members)
                  </option>
                ))}
              </select>
              {loadingGroups && <small>Loading groups...</small>}
            </div>
          )}

          {formData.groupOption === 'new' && (
            <>
              <div className="form-group">
                <label htmlFor="newGroupName">Group Name *</label>
                <input
                  type="text"
                  id="newGroupName"
                  name="newGroupName"
                  value={formData.newGroupName}
                  onChange={handleInputChange}
                  placeholder="Enter group name"
                  required={formData.groupOption === 'new'}
                  style={{ borderColor: formData.groupOption === 'new' && !formData.newGroupName.trim() ? '#ff6b6b' : '' }}
                />
                {formData.groupOption === 'new' && !formData.newGroupName.trim() && (
                  <small style={{ color: '#ff6b6b' }}>Group name is required</small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="newGroupDescription">Group Description</label>
                <textarea
                  id="newGroupDescription"
                  name="newGroupDescription"
                  value={formData.newGroupDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your group"
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        {/* Attributes */}
        <div className="form-section">
          <h3>🏷️ Attributes</h3>
          {formData.attributes.map((attr, index) => (
            <div key={index} className="attribute-group">
              <input
                type="text"
                placeholder="Trait type"
                value={attr.trait_type}
                onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={attr.value}
                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
              />
              {formData.attributes.length > 1 && (
                <button type="button" onClick={() => removeAttribute(index)} className="remove-btn">
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addAttribute} className="add-btn">
            + Add Attribute
          </button>
        </div>

        {/* Collection Details */}
        <div className="form-section">
          <h3>📚 Collection Details</h3>
          
          <div className="form-group">
            <label htmlFor="collectionName">Collection Name *</label>
            <input
              type="text"
              id="collectionName"
              name="collectionName"
              value={formData.collectionName}
              onChange={handleInputChange}
              placeholder="Story IP Assets"
              required
              style={{ borderColor: !formData.collectionName.trim() ? '#ff6b6b' : '' }}
            />
            {!formData.collectionName.trim() && <small style={{ color: '#ff6b6b' }}>Collection name is required</small>}
          </div>

          <div className="form-group">
            <label htmlFor="collectionSymbol">Collection Symbol *</label>
            <input
              type="text"
              id="collectionSymbol"
              name="collectionSymbol"
              value={formData.collectionSymbol}
              onChange={handleInputChange}
              placeholder="SIA"
              required
              style={{ borderColor: !formData.collectionSymbol.trim() ? '#ff6b6b' : '' }}
            />
            {!formData.collectionSymbol.trim() && <small style={{ color: '#ff6b6b' }}>Collection symbol is required</small>}
          </div>

          <div className="form-group">
            <label htmlFor="collectionDescription">Collection Description</label>
            <textarea
              id="collectionDescription"
              name="collectionDescription"
              value={formData.collectionDescription}
              onChange={handleInputChange}
              placeholder="Describe your collection"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="publicMinting"
                checked={formData.publicMinting}
                onChange={handleInputChange}
              />
              Enable Public Minting
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" disabled={loading || (!coverImageUrl && !mediaFileUrl)} className="submit-btn">
            {loading ? 'Minting...' : 'Mint IP Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EnhancedAssetForm