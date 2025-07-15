import { PinataSDK } from 'pinata-web3'
import fs from 'fs'
import path from 'path'

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3ZGRmYzM5NC1kNGE5LTQ2ZDAtYTViNS0xOTAwZDI1NDYyZTYiLCJlbWFpbCI6ImFnLmFnc29mdEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNTNlNDY1YWE5ZDYyODRiZThlMjMiLCJzY29wZWRLZXlTZWNyZXQiOiJmZjlkOTNkNjQwZDkzZjUwMTA4NzEwOGJlOTY5MjBiOTRkMjZlYTVmMjFjYTIzZjllZThkZjNlMTZkOGI3MDgzIiwiZXhwIjoxNzc4MTI5ODA1fQ.rvkuFIVKwd6ApI_NbxxiDS7ZMI3HKaZ6YLDfjuuaUDY', // Fallback for environments without `process`
})

export async function uploadJSONToIPFS(jsonMetadata: any): Promise<string> {
    const { IpfsHash } = await pinata.upload.json(jsonMetadata)
    return IpfsHash
}

// could use this to upload music (audio files) to IPFS
export async function uploadFileToIPFS(filePath: string, fileName: string, fileType: string): Promise<string> {
    const fullPath = path.join(process.cwd(), filePath)
    const blob = new Blob([fs.readFileSync(fullPath)])
    const file = new File([blob], fileName, { type: fileType })
    const { IpfsHash } = await pinata.upload.file(file)
    return IpfsHash
}
