// PIL (Programmable IP License) Terms Constants
// Based on Story Protocol documentation

export interface PILTerms {
  id: string
  name: string
  description: string
  commercialUse: boolean
  commercialAttribution: boolean
  commercializerCheck: boolean
  commercializerCheckData: string
  commercialRevShare: number
  derivativesAllowed: boolean
  derivativesAttribution: boolean
  derivativesApproval: boolean
  derivativesReciprocal: boolean
  territoryExpansion: boolean
  distributionChannels: string[]
  contentRestrictions: boolean
}

export const DEFAULT_PIL_TERMS: PILTerms[] = [
  {
    id: 'non-commercial',
    name: 'Non-Commercial Social Remixing',
    description: 'Allows remixing for non-commercial purposes only',
    commercialUse: false,
    commercialAttribution: false,
    commercializerCheck: false,
    commercializerCheckData: '',
    commercialRevShare: 0,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    territoryExpansion: false,
    distributionChannels: ['online', 'social'],
    contentRestrictions: false
  },
  {
    id: 'commercial',
    name: 'Commercial Use',
    description: 'Allows commercial use with revenue sharing',
    commercialUse: true,
    commercialAttribution: true,
    commercializerCheck: false,
    commercializerCheckData: '',
    commercialRevShare: 10, // 10% revenue share
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: false,
    territoryExpansion: true,
    distributionChannels: ['all'],
    contentRestrictions: false
  },
  {
    id: 'commercial-remix',
    name: 'Commercial Remix',
    description: 'Allows commercial remixing with higher revenue share',
    commercialUse: true,
    commercialAttribution: true,
    commercializerCheck: false,
    commercializerCheckData: '',
    commercialRevShare: 25, // 25% revenue share
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    territoryExpansion: true,
    distributionChannels: ['all'],
    contentRestrictions: false
  },
  {
    id: 'royalty-policy',
    name: 'Royalty Policy',
    description: 'Custom royalty policy with approval required',
    commercialUse: true,
    commercialAttribution: true,
    commercializerCheck: true,
    commercializerCheckData: '0x', // Custom check data
    commercialRevShare: 15, // 15% revenue share
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: true,
    derivativesReciprocal: false,
    territoryExpansion: true,
    distributionChannels: ['approved'],
    contentRestrictions: true
  },
  {
    id: 'no-derivatives',
    name: 'No Derivatives',
    description: 'Allows commercial use but no derivatives',
    commercialUse: true,
    commercialAttribution: true,
    commercializerCheck: false,
    commercializerCheckData: '',
    commercialRevShare: 5, // 5% revenue share
    derivativesAllowed: false,
    derivativesAttribution: false,
    derivativesApproval: false,
    derivativesReciprocal: false,
    territoryExpansion: true,
    distributionChannels: ['all'],
    contentRestrictions: false
  },
  {
    id: 'custom',
    name: 'Custom Terms',
    description: 'Define your own custom licensing terms',
    commercialUse: false,
    commercialAttribution: false,
    commercializerCheck: false,
    commercializerCheckData: '',
    commercialRevShare: 0,
    derivativesAllowed: false,
    derivativesAttribution: false,
    derivativesApproval: false,
    derivativesReciprocal: false,
    territoryExpansion: false,
    distributionChannels: [],
    contentRestrictions: false
  }
]

export const IP_ARTIFACT_TYPES = [
  { value: 'image', label: 'Image', icon: '🖼️', mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] },
  { value: 'audio', label: 'Audio', icon: '🎵', mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/flac'] },
  { value: 'video', label: 'Video', icon: '🎬', mimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/webm', 'video/mkv'] },
  { value: 'document', label: 'Document', icon: '📄', mimeTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  { value: 'pdf', label: 'PDF', icon: '📋', mimeTypes: ['application/pdf'] }
] as const

// Export the type explicitly
export type IPArtifactType = 'image' | 'audio' | 'video' | 'document' | 'pdf'

export const getArtifactTypeFromMimeType = (mimeType: string): IPArtifactType => {
  for (const type of IP_ARTIFACT_TYPES) {
    if (type.mimeTypes.includes(mimeType)) {
      return type.value as IPArtifactType
    }
  }
  return 'document' // default fallback
}

export const getArtifactTypeLabel = (type: IPArtifactType): string => {
  const artifactType = IP_ARTIFACT_TYPES.find(t => t.value === type)
  return artifactType ? artifactType.label : 'Document'
}

export const getArtifactTypeIcon = (type: IPArtifactType): string => {
  const artifactType = IP_ARTIFACT_TYPES.find(t => t.value === type)
  return artifactType ? artifactType.icon : '📄'
}