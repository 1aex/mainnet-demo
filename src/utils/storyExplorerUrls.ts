// Story Explorer URL utilities for consistent linking

export const STORY_EXPLORER_BASE_URL = 'https://explorer.story.foundation'

/**
 * Get Story Explorer URL for an IP Asset
 */
export function getIPAssetUrl(ipAssetId: string): string {
  return `${STORY_EXPLORER_BASE_URL}/ipa/${ipAssetId}`
}

/**
 * Get Story Explorer URL for a transaction
 */
export function getTransactionUrl(txHash: string): string {
  return `${STORY_EXPLORER_BASE_URL}/tx/${txHash}`
}

/**
 * Get Story Explorer URL for a license
 */
export function getLicenseUrl(licenseId: string): string {
  return `${STORY_EXPLORER_BASE_URL}/license/${licenseId}`
}

/**
 * Get Story Explorer URL for a PIL Terms
 */
export function getPILTermsUrl(pilTermsId: string): string {
  return `${STORY_EXPLORER_BASE_URL}/pil/${pilTermsId}`
}

/**
 * Get Story Explorer URL for an address
 */
export function getAddressUrl(address: string): string {
  return `${STORY_EXPLORER_BASE_URL}/address/${address}`
}

/**
 * Open URL in new tab with proper attributes
 */
export function openInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Get display text for transaction hash (truncated)
 */
export function formatTransactionHash(txHash: string, length: number = 12): string {
  if (!txHash) return ''
  if (txHash.length <= length) return txHash
  return `${txHash.slice(0, length)}...${txHash.slice(-4)}`
}

/**
 * Get display text for IP Asset ID (truncated)
 */
export function formatIPAssetId(ipAssetId: string, length: number = 12): string {
  if (!ipAssetId) return ''
  if (ipAssetId.length <= length) return ipAssetId
  return `${ipAssetId.slice(0, length)}...${ipAssetId.slice(-4)}`
}

/**
 * Validate if string looks like a transaction hash
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

/**
 * Validate if string looks like an IP Asset ID
 */
export function isValidIPAssetId(id: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(id)
}

/**
 * Get Story Explorer links for an asset
 */
export function getAssetExplorerLinks(asset: {
  ip_asset_id?: string
  token_id?: string
  transaction_hash?: string
  creator_address?: string
  pil_terms_id?: string
}) {
  const links: Array<{
    label: string
    url: string
    icon: string
    type: 'asset' | 'transaction' | 'address' | 'license'
  }> = []

  if (asset.ip_asset_id && isValidIPAssetId(asset.ip_asset_id)) {
    links.push({
      label: 'IP Asset',
      url: getIPAssetUrl(asset.ip_asset_id),
      icon: '🌟',
      type: 'asset'
    })
  }

  if (asset.transaction_hash && isValidTransactionHash(asset.transaction_hash)) {
    links.push({
      label: 'Transaction',
      url: getTransactionUrl(asset.transaction_hash),
      icon: '🔍',
      type: 'transaction'
    })
  }

  if (asset.creator_address && isValidIPAssetId(asset.creator_address)) {
    links.push({
      label: 'Creator',
      url: getAddressUrl(asset.creator_address),
      icon: '👤',
      type: 'address'
    })
  }

  if (asset.pil_terms_id) {
    links.push({
      label: 'PIL Terms',
      url: getPILTermsUrl(asset.pil_terms_id),
      icon: '⚖️',
      type: 'license'
    })
  }

  return links
}

/**
 * Copy Story Explorer URL to clipboard
 */
export async function copyExplorerUrlToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch (error) {
    console.error('Failed to copy URL to clipboard:', error)
    return false
  }
}

/**
 * Share Story Explorer URL (Web Share API)
 */
export async function shareExplorerUrl(
  url: string, 
  title: string = 'Story Protocol Asset'
): Promise<boolean> {
  if (!navigator.share) {
    // Fallback to copy to clipboard
    return copyExplorerUrlToClipboard(url)
  }

  try {
    await navigator.share({
      title,
      url,
      text: `Check out this ${title} on Story Explorer`
    })
    return true
  } catch (error) {
    console.error('Failed to share URL:', error)
    return copyExplorerUrlToClipboard(url)
  }
}

/**
 * Generate Story Explorer metadata for an asset
 */
export function generateExplorerMetadata(asset: {
  asset_name?: string
  ip_asset_id?: string
  token_id?: string
  transaction_hash?: string
  creator_address?: string
  network?: string
}) {
  return {
    title: asset.asset_name || 'Story Protocol Asset',
    ipAssetUrl: asset.ip_asset_id ? getIPAssetUrl(asset.ip_asset_id) : null,
    transactionUrl: asset.transaction_hash ? getTransactionUrl(asset.transaction_hash) : null,
    creatorUrl: asset.creator_address ? getAddressUrl(asset.creator_address) : null,
    network: asset.network || 'Story Protocol',
    explorerLinks: getAssetExplorerLinks(asset)
  }
}

// Export constants for easy access
export const STORY_EXPLORER_URLS = {
  BASE: STORY_EXPLORER_BASE_URL,
  IP_ASSET: (id: string) => getIPAssetUrl(id),
  TRANSACTION: (hash: string) => getTransactionUrl(hash),
  ADDRESS: (address: string) => getAddressUrl(address),
  PIL_TERMS: (id: string) => getPILTermsUrl(id),
  LICENSE: (id: string) => getLicenseUrl(id)
} as const