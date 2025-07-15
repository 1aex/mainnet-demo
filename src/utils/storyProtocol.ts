import { StoryClient } from '@story-protocol/core-sdk'
import type { PublicClient, WalletClient } from 'viem'
import { http, keccak256, toBytes } from 'viem'
import type { PILTerms, IPArtifactType } from '../constants/pilTerms'
import { PinataSDK } from 'pinata-web3'
import { validateStoryProtocolMetadata, logDiagnosticResult } from './storyProtocolDiagnostic'

// PIL Flavors - Reusable license terms constants based on Story Protocol documentation
// Reference: https://docs.story.foundation/concepts/programmable-ip-license/pil-flavors

export const PIL_FLAVORS = {
  // Non-Commercial Social Remixing - ID: 1
  NON_COMMERCIAL_SOCIAL_REMIXING: {
    transferable: true,
    royaltyPolicy: '0x0000000000000000000000000000000000000000' as `0x${string}`, // No royalty for non-commercial
    defaultMintingFee: BigInt(0),
    expiration: BigInt(0),
    commercialUse: false,
    commercialAttribution: false,
    commercializerChecker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    commercializerCheckerData: '0x' as `0x${string}`,
    commercialRevShare: 0,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: BigInt(0),
    currency: '0x0000000000000000000000000000000000000000' as `0x${string}`, // No currency for non-commercial
    uri: 'https://github.com/storyprotocol/protocol-core/blob/main/assets/license-terms/PILFlavors/NonCommercialSocialRemixing.json',
  },

  // Commercial Use - Pay to use with attribution, no derivatives
  COMMERCIAL_USE: {
    transferable: true,
    royaltyPolicy: '0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086' as `0x${string}`, // RoyaltyModule mainnet address
    defaultMintingFee: BigInt('100000000000000000'), // 0.1 ETH example
    expiration: BigInt(0),
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    commercializerCheckerData: '0x' as `0x${string}`,
    commercialRevShare: 0,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: false,
    derivativesAttribution: false,
    derivativesApproval: false,
    derivativesReciprocal: false,
    derivativeRevCeiling: BigInt(0),
    currency: '0x1514000000000000000000000000000000000000' as `0x${string}`, // WIP Token
    uri: 'https://github.com/storyprotocol/protocol-core/blob/main/assets/license-terms/PILFlavors/CommercialUse.json',
  },

  // Commercial Remix - Pay to use with attribution and revenue sharing
  COMMERCIAL_REMIX: {
    transferable: true,
    royaltyPolicy: '0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086' as `0x${string}`, // RoyaltyModule mainnet address
    defaultMintingFee: BigInt('100000000000000000'), // 0.1 ETH example
    expiration: BigInt(0),
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    commercializerCheckerData: '0x' as `0x${string}`,
    commercialRevShare: 1000, // 10% in basis points
    commercialRevCeiling: BigInt('1000000000000000000000'), // 1000 ETH example
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: BigInt('1000000000000000000000'), // 1000 ETH example
    currency: '0x1514000000000000000000000000000000000000' as `0x${string}`, // WIP Token
    uri: 'https://github.com/storyprotocol/protocol-core/blob/main/assets/license-terms/PILFlavors/CommercialRemix.json',
  },

  // Basic Free License - Simple permissive license
  FREE_LICENSE: {
    transferable: true,
    royaltyPolicy: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    defaultMintingFee: BigInt(0),
    expiration: BigInt(0),
    commercialUse: false,
    commercialAttribution: false,
    commercializerChecker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    commercializerCheckerData: '0x' as `0x${string}`,
    commercialRevShare: 0,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: true,
    derivativesAttribution: false,
    derivativesApproval: false,
    derivativesReciprocal: false,
    derivativeRevCeiling: BigInt(0),
    currency: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    uri: '',
  }
} as const

// Helper function to get PIL terms based on license type
export function getPILTerms(licenseType: keyof typeof PIL_FLAVORS = 'NON_COMMERCIAL_SOCIAL_REMIXING') {
  return PIL_FLAVORS[licenseType]
}

// Helper function to get PIL terms with custom parameters
export function getCustomPILTerms(
  baseType: keyof typeof PIL_FLAVORS,
  overrides: Partial<typeof PIL_FLAVORS.NON_COMMERCIAL_SOCIAL_REMIXING> = {}
) {
  return {
    ...PIL_FLAVORS[baseType],
    ...overrides
  }
}

export interface IPGroup {
  id: string
  name: string
  description: string
  created_at?: string
  creator_address?: string
  member_count?: number
}

// Story Protocol compliant metadata structure
export interface StoryProtocolMetadata {
  // IP Asset Metadata (Story Protocol specific)
  ipMetadata: {
    title: string
    description: string
    createdAt: string
    ipType?: IPArtifactType
    creators: Array<{
      name: string
      address: string
      contributionPercent: number
    }>
    media: {
      originalUrl: string
      mediaType: string // MIME type: image/jpeg, audio/mpeg, video/mp4, application/pdf
      thumbnailUrl?: string
    }
    // Additional fields for Story Protocol explorer compatibility
    image?: string
    imageHash?: string
    mediaUrl?: string
    mediaHash?: string
    mediaType?: string
    tags?: string[]
    group?: IPGroup
    external_url?: string
    relationships?: {
      parentIpIds?: string[]
      rootIpIds?: string[]
    }
  }
  
  // NFT Metadata (OpenSea standard)
  nftMetadata: {
    name: string
    description: string
    image: string
    attributes: Array<{
      trait_type: string
      value: string
    }>
    animation_url?: string
    external_url?: string
  }
  
  // Collection metadata
  collection?: {
    name: string
    symbol: string
    description: string
    public_minting: boolean
  }
}

// Legacy interface for backward compatibility
export interface AssetMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
  external_url?: string
  // Story Protocol specific fields
  creator?: string
  creationDate?: string
  ipType?: IPArtifactType
  tags?: string[]
  license?: {
    type: string
    commercial_use: boolean
    derivatives: boolean
    attribution: boolean
    revenue_share?: number
  }
  // PIL Terms
  pilTerms?: PILTerms
  // Group information
  group?: IPGroup
  // Collection metadata
  collection?: {
    name: string
    symbol: string
    description: string
    public_minting: boolean
  }
  // Enhanced NFT metadata
  nftMetadata?: {
    animation_url?: string
    background_color?: string
    youtube_url?: string
  }
  // Enhanced IP metadata
  ipMetadata?: {
    title?: string
    creatorName?: string
    creatorAddress?: string
    contributionPercent?: number
    mediaType?: string
    thumbnailUrl?: string
    parentIpIds?: string[]
    rootIpIds?: string[]
    createdAt?: string
  }
  // Media file references for Story Explorer
  mediaFiles?: {
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
  }
}

// Helper function to detect media type from file or URL
export function detectMediaType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || ''
  
  const mediaTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg', 
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'json': 'application/json'
  }
  
  return mediaTypes[ext] || 'application/octet-stream'
}

// Helper function to convert legacy metadata to Story Protocol compliant format
export function convertToStoryProtocolMetadata(
  legacyMetadata: AssetMetadata,
  fileUrl: string,
  fileHash: string,
  mediaFilename?: string,
  creatorAddress?: string
): StoryProtocolMetadata {
  const mediaType = mediaFilename ? detectMediaType(mediaFilename) : 'image/jpeg'
  const supabaseUrl = fileUrl // Use Supabase URL directly as CDN
  
  // Create comprehensive IP metadata following Story Protocol standards
  const ipMetadata = {
    title: legacyMetadata.name,
    description: legacyMetadata.description,
    createdAt: new Date().toISOString(), // Required timestamp
    ipType: legacyMetadata.ipType || (mediaType.startsWith('image/') ? 'image' : 
             mediaType.startsWith('audio/') ? 'audio' : 
             mediaType.startsWith('video/') ? 'video' : 'document'),
    creators: [{
      name: legacyMetadata.creator || 'Creator',
      address: creatorAddress || '0x0000000000000000000000000000000000000000',
      contributionPercent: 100
    }],
    media: {
      originalUrl: supabaseUrl, // Use Supabase URL for media
      mediaType: mediaType,
      thumbnailUrl: legacyMetadata.ipMetadata?.thumbnailUrl || legacyMetadata.image || supabaseUrl
    },
    // Additional fields for Story Protocol explorer compatibility
    image: supabaseUrl, // Cover image URL (for preview)
    imageHash: fileHash, // Hash of the cover image
    ...(mediaType.startsWith('audio/') || mediaType.startsWith('video/') ? {
      mediaUrl: supabaseUrl, // Media file URL for audio/video
      mediaHash: fileHash, // Hash of the media file
      mediaType: mediaType
    } : {}),
    tags: legacyMetadata.tags || [],
    group: legacyMetadata.group,
    external_url: legacyMetadata.external_url,
    relationships: {
      parentIpIds: legacyMetadata.ipMetadata?.parentIpIds || [],
      rootIpIds: legacyMetadata.ipMetadata?.rootIpIds || []
    }
  }
  
  // Create NFT metadata following OpenSea standards with user-provided enhancements
  const nftMetadata = {
    name: legacyMetadata.name,
    description: legacyMetadata.description,
    image: supabaseUrl, // Use Supabase URL for main image display
    attributes: legacyMetadata.attributes || [],
    external_url: legacyMetadata.external_url,
    // Enhanced NFT metadata with user inputs or defaults
    animation_url: legacyMetadata.nftMetadata?.animation_url || 
                  (['audio/', 'video/'].some(type => mediaType.startsWith(type)) ? supabaseUrl : undefined),
    background_color: legacyMetadata.nftMetadata?.background_color,
    youtube_url: legacyMetadata.nftMetadata?.youtube_url,
    // Add media-specific fields for better compatibility
    media_type: legacyMetadata.ipMetadata?.mediaType || mediaType,
    media_url: supabaseUrl // Direct access URL for the media file
  }
  
  return {
    ipMetadata,
    nftMetadata,
    collection: legacyMetadata.collection
  }
}

// Story Protocol mainnet contract addresses (deployed on Story Network)
export const STORY_MAINNET_CONTRACTS = {
  // Core Protocol Contracts
  AccessController: '0xcCF37d0a503Ee1D4C11208672e622ed3DFB2275a',
  CoreMetadataModule: '0x6E81a25C99C6e8430aeC7353325EB138aFE5DC16',
  IPAssetRegistry: '0x77319B4031e6eF1250907aa00018B8B1c67a244b',
  LicenseRegistry: '0x529a750E02d8E2f15649c13D69a465286a780e24',
  LicenseToken: '0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC',
  LicensingModule: '0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f',
  RoyaltyModule: '0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086',
  
  // Periphery Contracts
  DerivativeWorkflows: '0x9e2d496f72C547C2C535B167e06ED8729B374a4f',
  RegistrationWorkflows: '0xbe39E1C756e921BD25DF86e7AAa31106d1eb0424',
  TokenizerModule: '0xAC937CeEf893986A026f701580144D9289adAC4C',
  
  // SPG Contracts
  SPGNFTBeacon: '0xD2926B9ecaE85fF59B6FB0ff02f568a680c01218',
  SPGNFTImpl: '0x5266215a00c31AaA2f2BB7b951Ea0028Ea8b4e37',
  
  // Token Contracts
  WIP_TOKEN: '0x1514000000000000000000000000000000000000', // Native IP token
  MERC20: '0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E',
  
  // License Hooks
  LockLicenseHook: '0x5D874d4813c4A8A9FB2AB55F30cED9720AEC0222',
  TotalLicenseTokenLimitHook: '0xB72C9812114a0Fc74D49e01385bd266A75960Cda',
  
  // PIL Template
  PILicenseTemplate: '0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316',
  
  // Utilities
  Multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
} as const

export class StoryProtocolService {
  private storyClient: StoryClient
  private walletClient?: WalletClient
  private pinata: PinataSDK

  constructor(_publicClient: PublicClient, walletClient?: WalletClient) {
    this.walletClient = walletClient
    
    // Use the mainnet Story Protocol configuration with deployed contracts
    const config = {
      chain: 'story', // Story Protocol mainnet (chain ID 1514)
      transport: http('https://mainnet.storyrpc.io'),
      wallet: walletClient,
    }
    
    this.storyClient = StoryClient.newClient(config)
    
    // Initialize Pinata SDK
    this.pinata = new PinataSDK({
      pinataJwt: import.meta.env.VITE_PINATA_JWT || '',
    })
  }

  async registerIPA(tokenContract: string, tokenId: string, metadataURI: string): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for registration')
    }

    try {
      const response = await this.storyClient.ipAsset.register({
        nftContract: tokenContract as `0x${string}`,
        tokenId: BigInt(tokenId),
        ipMetadata: {
          ipMetadataURI: metadataURI,
        },
      })

      return response.ipId || ''
    } catch (error) {
      console.error('Error registering IP Asset:', error)
      throw error
    }
  }

  async mintAndRegisterAssetWithPILTerms(
    recipientAddress: string,
    legacyMetadata: AssetMetadata,
    fileUrl: string,
    fileHash: string,
    groupId?: string,
    licenseType: keyof typeof PIL_FLAVORS = 'NON_COMMERCIAL_SOCIAL_REMIXING',
    mediaFilename?: string
  ): Promise<{ tokenId: string; ipAssetId: string; txHash: string; groupId?: string; ipMetadataURI: string; nftMetadataURI: string; licenseTermsId?: string; storyMetadata?: StoryProtocolMetadata }> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for minting')
    }

    // Convert to Story Protocol compliant metadata
    const storyMetadata = convertToStoryProtocolMetadata(legacyMetadata, fileUrl, fileHash, mediaFilename, recipientAddress)
    
    // Update creator name if not provided
    if (storyMetadata.ipMetadata.creators[0] && !legacyMetadata.creator) {
      storyMetadata.ipMetadata.creators[0].name = `Creator ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`
    }

    console.log('Starting Story Protocol registration for media type:', storyMetadata.ipMetadata.media.mediaType)
    console.log('Media metadata:', {
      recipient: recipientAddress,
      title: storyMetadata.ipMetadata.title,
      mediaType: storyMetadata.ipMetadata.media.mediaType,
      licenseType,
      originalUrl: storyMetadata.ipMetadata.media.originalUrl,
      thumbnailUrl: storyMetadata.ipMetadata.media.thumbnailUrl
    })

    // Upload metadata to Pinata IPFS (required for Story Protocol)
    console.log('Uploading IP metadata to IPFS via Pinata...')
    const ipMetadataUpload = await this.pinata.upload.json(storyMetadata.ipMetadata)
    const ipMetadataURI = `ipfs://${ipMetadataUpload.IpfsHash}`
    console.log('IP metadata uploaded:', ipMetadataURI)
    console.log('IP metadata gateway URL:', `https://gateway.pinata.cloud/ipfs/${ipMetadataUpload.IpfsHash}`)

    console.log('Uploading NFT metadata to IPFS via Pinata...')
    const nftMetadataUpload = await this.pinata.upload.json(storyMetadata.nftMetadata)
    const nftMetadataURI = `ipfs://${nftMetadataUpload.IpfsHash}`
    console.log('NFT metadata uploaded:', nftMetadataURI)
    console.log('NFT metadata gateway URL:', `https://gateway.pinata.cloud/ipfs/${nftMetadataUpload.IpfsHash}`)
    
    // Validate metadata before upload
    const diagnosticResult = validateStoryProtocolMetadata(storyMetadata)
    logDiagnosticResult(diagnosticResult, 'Pre-Upload Metadata Validation')
    
    if (!diagnosticResult.isValid) {
      console.error('❌ Metadata validation failed! This may cause issues in the Story Protocol explorer.')
      console.error('Errors:', diagnosticResult.errors)
    }
    
    // Log the actual metadata being uploaded for debugging
    console.log('IP Metadata being uploaded:', JSON.stringify(storyMetadata.ipMetadata, null, 2))
    console.log('NFT Metadata being uploaded:', JSON.stringify(storyMetadata.nftMetadata, null, 2))

    // Generate proper 32-byte hashes for the metadata
    const ipMetadataHash = keccak256(toBytes(JSON.stringify(storyMetadata.ipMetadata)))
    const nftMetadataHash = keccak256(toBytes(JSON.stringify(storyMetadata.nftMetadata)))
    
    console.log('Generated metadata hashes:', {
      ipMetadataHash,
      nftMetadataHash
    })

    try {
      console.log('Starting Story Protocol registration with uploaded metadata...')

      // Use Story Protocol's simple workflow - just mint and register IP
      // Then attach PIL terms separately for better reliability
      console.log('Using simple mintAndRegisterIp workflow with separate PIL attachment...')
      
      // First try to create a collection if we don't have one
      // For now, we'll use a common collection approach or create one per user
      let spgNftContract = '0x0000000000000000000000000000000000000000' as `0x${string}`
      
      try {
        // Try to create a collection for this user if not exists
        console.log('Creating SPG NFT collection...')
        const collectionResponse = await this.storyClient.nftClient.createNFTCollection({
          name: legacyMetadata.collection?.name || `${storyMetadata.ipMetadata.creators[0]?.name || 'Creator'} Collection`,
          symbol: legacyMetadata.collection?.symbol || 'IP',
          maxSupply: 10000,
          mintFee: BigInt(0),
          mintFeeToken: STORY_MAINNET_CONTRACTS.WIP_TOKEN as `0x${string}`,
          mintFeeRecipient: recipientAddress as `0x${string}`,
          owner: recipientAddress as `0x${string}`,
          isPublicMinting: legacyMetadata.collection?.public_minting ?? true,
          mintOpen: true,
          contractURI: ''
        })
        
        if (collectionResponse.spgNftContract) {
          spgNftContract = collectionResponse.spgNftContract
          console.log('Created SPG NFT collection:', spgNftContract)
        }
      } catch (collectionError) {
        console.warn('Failed to create collection, will try without:', collectionError)
        // Continue with zero address - SDK might handle this internally
      }
      
      console.log('Minting and registering IP with contract:', spgNftContract)
      const response = await this.storyClient.ipAsset.mintAndRegisterIp({
        spgNftContract: spgNftContract,
        recipient: recipientAddress as `0x${string}`,
        ipMetadata: {
          ipMetadataURI: ipMetadataURI,
          ipMetadataHash: ipMetadataHash,
          nftMetadataURI: nftMetadataURI,
          nftMetadataHash: nftMetadataHash,
        },
        allowDuplicates: false
      })
      
      let licenseTermsId = 'default'
      
      // Try to attach PIL terms after successful IP registration
      if (response.ipId) {
        try {
          console.log('Attaching PIL terms to registered IP...')
          
          // For non-commercial social remixing, use the default license terms ID: 1
          if (licenseType === 'NON_COMMERCIAL_SOCIAL_REMIXING') {
            try {
              await this.storyClient.license.attachLicenseTerms({
                ipId: response.ipId as `0x${string}`,
                licenseTemplate: STORY_MAINNET_CONTRACTS.PILicenseTemplate as `0x${string}`,
                licenseTermsId: BigInt(1) // Default license terms ID for non-commercial social remixing
              })
              licenseTermsId = '1'
              console.log('Default PIL terms attached successfully with ID:', licenseTermsId)
            } catch (attachError) {
              console.warn('Failed to attach default PIL terms:', attachError)
            }
          } else {
            // For commercial licenses, register new terms
            let pilResponse
            
            switch (licenseType) {
              case 'COMMERCIAL_USE':
                pilResponse = await this.storyClient.license.registerCommercialUsePIL({
                  defaultMintingFee: getPILTerms(licenseType).defaultMintingFee,
                  currency: getPILTerms(licenseType).currency
                })
                break
              case 'COMMERCIAL_REMIX':
                pilResponse = await this.storyClient.license.registerCommercialRemixPIL({
                  defaultMintingFee: getPILTerms(licenseType).defaultMintingFee,
                  commercialRevShare: getPILTerms(licenseType).commercialRevShare,
                  currency: getPILTerms(licenseType).currency
                })
                break
            }
            
            if (pilResponse?.licenseTermsId) {
              // Attach the license terms to the IP
              await this.storyClient.license.attachLicenseTerms({
                ipId: response.ipId as `0x${string}`,
                licenseTemplate: STORY_MAINNET_CONTRACTS.PILicenseTemplate as `0x${string}`,
                licenseTermsId: pilResponse.licenseTermsId
              })
              licenseTermsId = pilResponse.licenseTermsId.toString()
              console.log('Commercial PIL terms attached successfully with ID:', licenseTermsId)
            }
          }
        } catch (licenseError) {
          console.warn('Failed to attach PIL terms, continuing with default:', licenseError)
          // Fallback to default license terms ID
          licenseTermsId = '1'
        }
      }
      
      console.log('Story Protocol registration successful:', response)
      
      // Log Story Protocol explorer URL for easy access
      if (response.ipId) {
        const explorerUrl = `https://explorer.story.foundation/ipa/${response.ipId}`
        console.log('🔍 View this IP Asset in Story Protocol Explorer:', explorerUrl)
      }
      
      return {
        tokenId: response.tokenId?.toString() || '',
        ipAssetId: response.ipId || '',
        txHash: response.txHash || '',
        groupId: groupId, // Pass through groupId for future group functionality
        ipMetadataURI,
        nftMetadataURI,
        licenseTermsId: licenseTermsId,
        storyMetadata: storyMetadata // Include the full metadata for storage
      }
    } catch (error) {
      console.error('Error in Story Protocol registration:', error)
      
      // Check if this is a network/RPC issue
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.')
      }
      
      // If authorization error, provide helpful message
      if (error instanceof Error && error.message.includes('CallerNotAuthorizedToMint')) {
        throw new Error('Unable to create NFT collection. Please try again or contact support.')
      }
      
      throw error
    }
  }

  async createGroup(
    name: string,
    description: string,
    licenseType: keyof typeof PIL_FLAVORS = 'NON_COMMERCIAL_SOCIAL_REMIXING'
  ): Promise<{ groupId: string; txHash: string }> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for group creation')
    }

    try {
      console.log('Creating new IP group:', { name, description, licenseType })

      // TODO: Implement proper group creation when SDK supports GroupingWorkflows
      // For now, use placeholder since Story Protocol SDK may not have grouping module yet
      console.warn('Group creation using placeholder - implement when GroupingWorkflows is available in SDK')
      
      return {
        groupId: `group_${Date.now()}`,
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      }
    } catch (error) {
      console.error('Error creating group:', error)
      
      // Fallback to placeholder for development
      console.warn('Group creation failed, using placeholder')
      return {
        groupId: `group_${Date.now()}`,
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000000'
      }
    }
  }

  async addToGroup(ipAssetId: string, groupId: string): Promise<void> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for adding to group')
    }

    try {
      console.log('Adding IP to group:', { ipAssetId, groupId })

      // TODO: Implement add to group when SDK supports it
      console.warn('Add to group functionality not available in current SDK version')
    } catch (error) {
      console.error('Error adding IP to group:', error)
      throw error
    }
  }

  async getGroupDetails(groupId: string): Promise<IPGroup | null> {
    try {
      // This would be implemented based on Story Protocol's group query methods
      // For now, return a placeholder
      return {
        id: groupId,
        name: 'Group Name',
        description: 'Group Description',
        created_at: new Date().toISOString(),
        member_count: 0
      }
    } catch (error) {
      console.error('Error fetching group details:', error)
      return null
    }
  }

  // Keep the old method for backward compatibility
  async mintAndRegisterAsset(
    recipientAddress: string,
    metadata: AssetMetadata,
    fileUrl: string,
    fileHash: string,
    mediaFilename?: string
  ): Promise<{ tokenId: string; ipAssetId: string; txHash: string }> {
    // Use default non-commercial license for backward compatibility
    const result = await this.mintAndRegisterAssetWithPILTerms(
      recipientAddress,
      metadata,
      fileUrl,
      fileHash,
      undefined, // no groupId
      'NON_COMMERCIAL_SOCIAL_REMIXING', // default license type
      mediaFilename
    )

    return {
      tokenId: result.tokenId,
      ipAssetId: result.ipAssetId,
      txHash: result.txHash
    }
  }

  async getIPAssetDetails(ipAssetId: string) {
    try {
      // For now, return a simple object since the exact API method may vary
      return {
        ipAssetId,
        owner: '',
        metadataURI: '',
        tokenId: '',
        nftContract: ''
      }
    } catch (error) {
      console.error('Error fetching IP Asset details:', error)
      throw error
    }
  }
}