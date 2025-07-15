import React, { useEffect, useState } from 'react'
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi'

const STORY_MAINNET_CHAIN_ID = 1514

const WalletConnect: React.FC = () => {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showNetworkToast, setShowNetworkToast] = useState(false)

  useEffect(() => {
    if (isConnected && chainId) {
      if (chainId !== STORY_MAINNET_CHAIN_ID) {
        setShowNetworkToast(true)
        const timer = setTimeout(() => setShowNetworkToast(false), 5000)
        return () => clearTimeout(timer)
      } else {
        setShowNetworkToast(false)
      }
    }
  }, [isConnected, chainId])

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.type === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button 
          onClick={handleConnect}
          disabled={isPending}
          className="connect-btn"
        >
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(address || '')}</span>
          <button onClick={() => disconnect()} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      )}
      
      {showNetworkToast && (
        <div className="network-toast">
          <p>⚠️ Please switch to Story Protocol Mainnet to use this app</p>
          <p>Network: Story Mainnet (Chain ID: 1514)</p>
        </div>
      )}
    </div>
  )
}

export default WalletConnect