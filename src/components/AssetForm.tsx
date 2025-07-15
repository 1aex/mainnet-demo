import React, { useState } from 'react'
import FileUpload from './FileUpload'
import type { AssetMetadata } from '../utils/storyProtocol'

interface AssetFormProps {
  onSubmit: (metadata: AssetMetadata, fileCid: string) => void
  loading?: boolean
}

const AssetForm: React.FC<AssetFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    externalUrl: '',
    attributes: [{ trait_type: '', value: '' }],
    ipType: 'other' as 'character' | 'video' | 'image' | 'audio' | 'text' | 'other',
    tags: '',
    commercialUse: false,
    derivativesAllowed: true,
    attribution: true,
    // Collection details
    collectionName: 'Story IP Assets',
    collectionSymbol: 'SIA',
    collectionDescription: '',
    isPublicMinting: true
  })
  const [fileCid, setFileCid] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    if (formData.attributes.length > 1) {
      const newAttributes = formData.attributes.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        attributes: newAttributes
      }))
    }
  }

  const handleFileUploaded = (cid: string, file: File) => {
    setFileCid(cid)
    setUploadedFile(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fileCid) {
      alert('Please upload a file first')
      return
    }

    if (!formData.name.trim()) {
      alert('Please provide a name for the asset')
      return
    }

    const metadata: AssetMetadata = {
      name: formData.name,
      description: formData.description,
      image: `ipfs://${fileCid}`,
      attributes: formData.attributes.filter(attr => 
        attr.trait_type.trim() && attr.value.trim()
      ),
      external_url: formData.externalUrl || undefined,
      ipType: formData.ipType,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      creationDate: new Date().toISOString(),
      license: {
        type: 'custom',
        commercialUse: formData.commercialUse,
        derivativesAllowed: formData.derivativesAllowed,
        attribution: formData.attribution
      },
      collection: {
        name: formData.collectionName,
        symbol: formData.collectionSymbol,
        description: formData.collectionDescription,
        isPublicMinting: formData.isPublicMinting
      }
    }

    onSubmit(metadata, fileCid)
  }

  return (
    <form onSubmit={handleSubmit} className="asset-form">
      <div className="form-section">
        <h3>Upload Asset File</h3>
        <FileUpload onFileUploaded={handleFileUploaded} />
      </div>

      <div className="form-section">
        <h3>Collection Details</h3>
        
        <div className="form-group">
          <label htmlFor="collectionName">Collection Name</label>
          <input
            type="text"
            id="collectionName"
            name="collectionName"
            value={formData.collectionName}
            onChange={handleInputChange}
            placeholder="My IP Asset Collection"
          />
        </div>

        <div className="form-group">
          <label htmlFor="collectionSymbol">Collection Symbol</label>
          <input
            type="text"
            id="collectionSymbol"
            name="collectionSymbol"
            value={formData.collectionSymbol}
            onChange={handleInputChange}
            placeholder="MIA"
            maxLength={10}
          />
        </div>

        <div className="form-group">
          <label htmlFor="collectionDescription">Collection Description</label>
          <textarea
            id="collectionDescription"
            name="collectionDescription"
            value={formData.collectionDescription}
            onChange={handleInputChange}
            rows={3}
            placeholder="Describe your NFT collection"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isPublicMinting"
              checked={formData.isPublicMinting}
              onChange={handleInputChange}
            />
            Allow Public Minting
          </label>
          <small>When enabled, others can mint from your collection</small>
        </div>
      </div>

      <div className="form-section">
        <h3>Asset Details</h3>
        
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Describe your asset"
          />
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
          <label htmlFor="ipType">IP Asset Type</label>
          <select
            id="ipType"
            name="ipType"
            value={formData.ipType}
            onChange={handleInputChange}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="character">Character</option>
            <option value="text">Text/Writing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="art, digital, creative, etc."
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Licensing Terms</h3>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="commercialUse"
              checked={formData.commercialUse}
              onChange={handleInputChange}
            />
            Allow Commercial Use
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="derivativesAllowed"
              checked={formData.derivativesAllowed}
              onChange={handleInputChange}
            />
            Allow Derivatives/Remixes
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="attribution"
              checked={formData.attribution}
              onChange={handleInputChange}
            />
            Require Attribution
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Attributes</h3>
        {formData.attributes.map((attribute, index) => (
          <div key={index} className="attribute-group">
            <input
              type="text"
              placeholder="Trait type (e.g., Color)"
              value={attribute.trait_type}
              onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Value (e.g., Blue)"
              value={attribute.value}
              onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
            />
            {formData.attributes.length > 1 && (
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="remove-attribute"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addAttribute} className="add-attribute">
          + Add Attribute
        </button>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={loading || !fileCid}
          className="submit-btn"
        >
          {loading ? 'Minting...' : 'Mint IP Asset'}
        </button>
      </div>
    </form>
  )
}

export default AssetForm