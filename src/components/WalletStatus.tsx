import React from 'react'
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'

const WalletStatus: React.FC = () => {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  if (!isConnected) {
    return null
  }

  return (
    <div style={{
      background: '#f0f0f0',
      padding: '10px',
      margin: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔍 Wallet Debug Info:</h4>
      <div>✅ Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>📍 Address: {address || 'Not available'}</div>
      <div>🔗 Chain ID: {chainId || 'Not available'}</div>
      <div>🌐 Public Client: {publicClient ? 'Available' : 'Not available'}</div>
      <div>💼 Wallet Client: {walletClient ? 'Available' : 'Not available'}</div>
      <div>🎯 Story Chain: {chainId === 1514 ? 'Correct (1514)' : `Wrong (${chainId}, expected 1514)`}</div>
    </div>
  )
}

export default WalletStatus