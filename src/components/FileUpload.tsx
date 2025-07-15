import React, { useState, useCallback } from 'react'
import { uploadWithHash } from '../utils/supabaseStorage'

interface FileUploadProps {
  onFileUploaded: (url: string, file: File, hash: string) => void
  acceptedTypes?: string[]
  maxSize?: number // in MB
}

const SUPPORTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  video: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime']
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  acceptedTypes = Object.values(SUPPORTED_TYPES).flat(),
  maxSize = 100 // 100MB default
}) => {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, url: string, hash: string, type: string }>>([])

  const validateFile = (file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      alert(`File type ${file.type} is not supported`)
      return false
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds ${maxSize}MB limit`)
      return false
    }

    return true
  }

  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(validateFile)
    
    if (validFiles.length === 0) return

    setUploading(true)

    try {
      for (const file of validFiles) {
        const result = await uploadWithHash(file, 'assets', 'uploads')
        
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          url: result.publicUrl,
          hash: result.hash,
          type: file.type
        }])
        
        onFileUploaded(result.publicUrl, file, result.hash)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('audio/')) return '🎵'
    if (type.startsWith('video/')) return '🎬'
    if (type === 'application/pdf') return '📄'
    return '📁'
  }

  return (
    <div className="file-upload-container">
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="file-input"
          id="file-upload"
        />
        
        <label htmlFor="file-upload" className="upload-label">
          {uploading ? (
            <div className="uploading-state">
              <div className="spinner"></div>
              <p>Uploading to Supabase...</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">📤</div>
              <h3>Drop files here or click to browse</h3>
              <p>Supported: Images, PDFs, Audio, Video (max {maxSize}MB)</p>
            </div>
          )}
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files</h4>
          <div className="file-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-icon">{getFileTypeIcon(file.type)}</span>
                <span className="file-name">{file.name}</span>
                <span className="file-url">URL: {file.url.substring(0, 50)}...</span>
                <span className="file-hash">Hash: {file.hash.substring(0, 20)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload