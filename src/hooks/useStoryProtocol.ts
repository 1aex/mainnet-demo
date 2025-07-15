
import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { StoryProtocolService, type AssetMetadata } from '../utils/storyProtocol'
import { saveAssetMetadata, getWalletAssets, getAssetsForStoryExplorer, type AssetMetadataRow, type IPGroupRow, type PILTermsRow } from '../utils/supabase'
import { buildStoryExplorerMetadata } from '../utils/storyExplorerMetadata'

export const useStoryProtocol = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [mintedAssets, setMintedAssets] = useState<Array<{
    ipAssetId: string
    tokenId: string
    metadata: AssetMetadata
    fileUrl: string
    fileHash: string
    txHash: string
  }>>([])
  const [supabaseAssets, setSupabaseAssets] = useState<AssetMetadataRow[]>([])
  const [walletGroups, setWalletGroups] = useState<IPGroupRow[]>([])
  const [walletPILTerms, setWalletPILTerms] = useState<PILTermsRow[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const loadWalletAssets = useCallback(async () => {
    if (!address) return

    setAssetsLoading(true)
    try {
      const walletData = await getWalletAssets(address)
      setSupabaseAssets(walletData.assets)
      setWalletGroups(walletData.groups)
      setWalletPILTerms(walletData.pilTerms)
      
      console.log('Loaded wallet assets:', {
        assets: walletData.assets.length,
        groups: walletData.groups.length,
        pilTerms: walletData.pilTerms.length
      })
      
      // Also demonstrate Story Explorer compatible data retrieval
      const storyExplorerAssets = await getAssetsForStoryExplorer(address)
      console.log('Story Explorer compatible assets loaded:', storyExplorerAssets.length)
    } catch (err) {
      console.error('Error loading wallet assets:', err)
      setError('Failed to load wallet assets')
    } finally {
      setAssetsLoading(false)
    }
  }, [address])

  // Auto-load wallet assets when address changes
  useEffect(() => {
    if (address) {
      loadWalletAssets()
    } else {
      // Clear assets when wallet disconnects
      setSupabaseAssets([])
      setWalletGroups([])
      setWalletPILTerms([])
    }
  }, [address, loadWalletAssets])

  const mintAsset = useCallback(async (metadata: AssetMetadata, primaryFileUrl: string, primaryFileHash: string) => {
    console.log('🔍 Wallet Connection Check:', {
      address: !!address,
      walletClient: !!walletClient,
      publicClient: !!publicClient,
      addressValue: address,
    })
    
    if (!address) {
      setError('Please connect your wallet first')
      setTxStatus('error')
      return
    }
    
    if (!walletClient) {
      setError('Wallet client not available. Please ensure your wallet is connected and try again.')
      setTxStatus('error')
      return
    }
    
    if (!publicClient) {
      setError('Public client not available. Please check your network connection.')
      setTxStatus('error')
      return
    }

    setLoading(true)
    setError(null)
    setTxStatus('preparing')
    setTxHash('')

    try {
      // Add creator information to metadata
      const enrichedMetadata = {
        ...metadata,
        creator: address
      }

      // Initialize Story Protocol service
      const storyService = new StoryProtocolService(publicClient, walletClient)

      setTxStatus('signing')
      
      // Focus wallet window if possible
      if (window.ethereum && window.ethereum.isMetaMask && window.ethereum.request) {
        try {
          // Request to open/focus MetaMask
          await window.ethereum.request({ method: 'eth_requestAccounts' })
        } catch {
          // Silent fail if user denies
        }
      }
      
      // Use Story Protocol compliant minting with PIL terms
      const result = await storyService.mintAndRegisterAssetWithPILTerms(
        address,
        enrichedMetadata,
        primaryFileUrl,
        primaryFileHash,
        enrichedMetadata.group?.id
      )

      setTxHash(result.txHash)
      setTxStatus('pending')

      // Wait a bit to simulate transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTxStatus('success')

      // Add to local state
      const newAsset = {
        ipAssetId: result.ipAssetId,
        tokenId: result.tokenId,
        metadata: enrichedMetadata,
        fileUrl: primaryFileUrl,
        fileHash: primaryFileHash,
        txHash: result.txHash
      }

      setMintedAssets(prev => [...prev, newAsset])

      // Build and log Story Explorer metadata for debugging
      const storyExplorerMetadata = buildStoryExplorerMetadata(enrichedMetadata, result)
      console.log('🌟 Story Explorer Metadata Ready:', storyExplorerMetadata)

      // Save metadata to Supabase
      try {
        // Get the full metadata objects from the result
        const storyMetadata = result.storyMetadata
        
        const supabaseMetadata: AssetMetadataRow = {
          asset_name: enrichedMetadata.name,
          description: enrichedMetadata.description,
          external_url: enrichedMetadata.external_url,
          image_url: enrichedMetadata.image,
          file_url: primaryFileUrl,
          file_hash: primaryFileHash,
          // Store separate cover image and media file references
          cover_image_url: enrichedMetadata.mediaFiles?.coverImage?.url,
          cover_image_hash: enrichedMetadata.mediaFiles?.coverImage?.hash,
          media_file_url: enrichedMetadata.mediaFiles?.mediaFile?.url,
          media_file_hash: enrichedMetadata.mediaFiles?.mediaFile?.hash,
          media_file_type: enrichedMetadata.mediaFiles?.mediaFile?.type,
          ip_metadata_uri: result.ipMetadataURI,
          nft_metadata_uri: result.nftMetadataURI,
          ip_metadata: storyMetadata?.ipMetadata, // Store full IP metadata
          nft_metadata: storyMetadata?.nftMetadata, // Store full NFT metadata
          token_id: result.tokenId,
          ip_asset_id: result.ipAssetId,
          creator_address: address,
          collection_name: enrichedMetadata.collection?.name,
          collection_symbol: enrichedMetadata.collection?.symbol,
          collection_description: enrichedMetadata.collection?.description,
          ip_type: enrichedMetadata.ipType,
          tags: enrichedMetadata.tags,
          attributes: enrichedMetadata.attributes,
          license_commercial_use: enrichedMetadata.license?.commercial_use,
          license_derivatives: enrichedMetadata.license?.derivatives,
          license_attribution: enrichedMetadata.license?.attribution,
          license_revenue_share: enrichedMetadata.license?.revenue_share,
          public_minting: enrichedMetadata.collection?.public_minting,
          transaction_hash: result.txHash,
          network: 'Story Protocol',
          pil_terms_id: enrichedMetadata.pilTerms?.id,
          group_id: enrichedMetadata.group?.id,
          license_terms_id: result.licenseTermsId
        }

        await saveAssetMetadata(supabaseMetadata)
        console.log('Metadata saved to Supabase successfully')
      } catch (supabaseError) {
        console.error('Failed to save metadata to Supabase:', supabaseError)
        // Don't throw error here as the main minting was successful
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint asset'
      setError(errorMessage)
      setTxStatus('error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, walletClient])

  const getAssetDetails = useCallback(async (ipAssetId: string) => {
    if (!publicClient) return null

    try {
      const storyService = new StoryProtocolService(publicClient)
      return await storyService.getIPAssetDetails(ipAssetId)
    } catch (err) {
      console.error('Error fetching asset details:', err)
      return null
    }
  }, [publicClient])

  const loadSupabaseAssets = useCallback(async () => {
    // Use the new comprehensive wallet assets loader
    await loadWalletAssets()
  }, [loadWalletAssets])

  const resetTransactionStatus = useCallback(() => {
    setTxStatus('idle')
    setTxHash('')
    setError(null)
  }, [])

  return {
    mintAsset,
    getAssetDetails,
    loadSupabaseAssets,
    loadWalletAssets,
    resetTransactionStatus,
    loading,
    error,
    txStatus,
    txHash,
    mintedAssets,
    supabaseAssets,
    walletGroups,
    walletPILTerms,
    assetsLoading,
    isConnected: !!address
  }
}