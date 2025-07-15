import type { StoryProtocolMetadata } from './storyProtocol'

export interface DiagnosticResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: StoryProtocolMetadata
}

export function validateStoryProtocolMetadata(metadata: StoryProtocolMetadata): DiagnosticResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check IP Metadata
  const ipMetadata = metadata.ipMetadata
  
  // Required fields
  if (!ipMetadata.title || ipMetadata.title.trim() === '') {
    errors.push('IP metadata is missing required field: title')
  }
  
  if (!ipMetadata.description || ipMetadata.description.trim() === '') {
    errors.push('IP metadata is missing required field: description')
  }
  
  if (!ipMetadata.createdAt) {
    errors.push('IP metadata is missing required field: createdAt')
  }
  
  if (!ipMetadata.creators || ipMetadata.creators.length === 0) {
    errors.push('IP metadata is missing required field: creators')
  } else {
    ipMetadata.creators.forEach((creator, index) => {
      if (!creator.name || creator.name.trim() === '') {
        errors.push(`Creator ${index + 1} is missing required field: name`)
      }
      if (!creator.address || creator.address === '0x0000000000000000000000000000000000000000') {
        warnings.push(`Creator ${index + 1} has zero address - this may not display correctly in the explorer`)
      }
      if (creator.contributionPercent < 0 || creator.contributionPercent > 100) {
        warnings.push(`Creator ${index + 1} has invalid contribution percentage: ${creator.contributionPercent}`)
      }
    })
  }
  
  // Media validation
  if (!ipMetadata.media) {
    errors.push('IP metadata is missing required field: media')
  } else {
    if (!ipMetadata.media.originalUrl || ipMetadata.media.originalUrl.trim() === '') {
      errors.push('IP metadata media is missing required field: originalUrl')
    } else {
      try {
        new URL(ipMetadata.media.originalUrl)
      } catch {
        errors.push('IP metadata has invalid media.originalUrl')
      }
    }
    
    if (!ipMetadata.media.mediaType || ipMetadata.media.mediaType.trim() === '') {
      errors.push('IP metadata media is missing required field: mediaType')
    }
  }
  
  // Image/Media validation
  if (!ipMetadata.image || ipMetadata.image.trim() === '') {
    warnings.push('IP metadata is missing image field - this may affect preview display')
  } else {
    // Check if image URL is accessible
    try {
      new URL(ipMetadata.image)
    } catch {
      errors.push('IP metadata has invalid image URL')
    }
  }
  
  if (!ipMetadata.imageHash || ipMetadata.imageHash.trim() === '') {
    warnings.push('IP metadata is missing imageHash - this may affect integrity verification')
  }
  
  // Media-specific validation
  if (ipMetadata.mediaUrl) {
    try {
      new URL(ipMetadata.mediaUrl)
    } catch {
      errors.push('IP metadata has invalid mediaUrl')
    }
  }
  
  if (ipMetadata.mediaUrl && (!ipMetadata.mediaHash || ipMetadata.mediaHash.trim() === '')) {
    warnings.push('IP metadata has mediaUrl but missing mediaHash - this may affect integrity verification')
  }
  
  // Check NFT Metadata
  const nftMetadata = metadata.nftMetadata
  
  if (!nftMetadata.name || nftMetadata.name.trim() === '') {
    errors.push('NFT metadata is missing required field: name')
  }
  
  if (!nftMetadata.description || nftMetadata.description.trim() === '') {
    errors.push('NFT metadata is missing required field: description')
  }
  
  if (!nftMetadata.image || nftMetadata.image.trim() === '') {
    errors.push('NFT metadata is missing required field: image')
  } else {
    try {
      new URL(nftMetadata.image)
    } catch {
      errors.push('NFT metadata has invalid image URL')
    }
  }
  
  // Check if IP and NFT metadata are consistent
  if (ipMetadata.title !== nftMetadata.name) {
    warnings.push('IP metadata title and NFT metadata name do not match')
  }
  
  if (ipMetadata.description !== nftMetadata.description) {
    warnings.push('IP metadata description and NFT metadata description do not match')
  }
  
  if (ipMetadata.image !== nftMetadata.image) {
    warnings.push('IP metadata image and NFT metadata image do not match')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  }
}

export function logDiagnosticResult(result: DiagnosticResult, context: string = 'Story Protocol Metadata') {
  console.log(`\n🔍 ${context} Diagnostic Results:`)
  console.log(`✅ Valid: ${result.isValid}`)
  
  if (result.errors.length > 0) {
    console.log(`\n❌ Errors (${result.errors.length}):`)
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
  }
  
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${result.warnings.length}):`)
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`)
    })
  }
  
  if (result.isValid && result.warnings.length === 0) {
    console.log('\n🎉 Metadata is fully compliant with Story Protocol standards!')
  }
  
  console.log('\n📋 Metadata Preview:')
  console.log('IP Metadata:', JSON.stringify(result.metadata?.ipMetadata, null, 2))
  console.log('NFT Metadata:', JSON.stringify(result.metadata?.nftMetadata, null, 2))
}