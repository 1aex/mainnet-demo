import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { MemoryDatastore } from 'datastore-core'
import { MemoryBlockstore } from 'blockstore-core'

let heliaInstance: any = null

export async function getHelia() {
  if (!heliaInstance) {
    const blockstore = new MemoryBlockstore()
    const datastore = new MemoryDatastore()
    
    heliaInstance = await createHelia({
      blockstore,
      datastore
    })
  }
  return heliaInstance
}

export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const helia = await getHelia()
    const fs = unixfs(helia)
    
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)
    
    const cid = await fs.addFile({
      path: file.name,
      content: uint8Array
    })
    
    return cid.toString()
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    throw error
  }
}

export async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  try {
    const helia = await getHelia()
    const fs = unixfs(helia)
    
    const metadataString = JSON.stringify(metadata)
    const uint8Array = new TextEncoder().encode(metadataString)
    
    const cid = await fs.addFile({
      path: 'metadata.json',
      content: uint8Array
    })
    
    return cid.toString()
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error)
    throw error
  }
}

export function getIPFSUrl(cid: string): string {
  // Use Pinata gateway for better performance and reliability
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

export function getIPFSGatewayUrls(cid: string) {
  return {
    pinata: `https://gateway.pinata.cloud/ipfs/${cid}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
    ipfs: `https://ipfs.io/ipfs/${cid}`,
    dweb: `https://dweb.link/ipfs/${cid}`
  }
}