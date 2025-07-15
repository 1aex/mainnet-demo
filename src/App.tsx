import React, { useState } from 'react'
import Web3Provider from './providers/Web3Provider'
import WalletConnect from './components/WalletConnect'
import WalletStatus from './components/WalletStatus'
import EnhancedAssetForm from './components/EnhancedAssetForm'
import AssetListWithSupabase from './components/AssetListWithSupabase'
import TransactionStatus from './components/TransactionStatus'
import SupabaseDebugger from './components/SupabaseDebugger'
import { useStoryProtocol } from './hooks/useStoryProtocol'
import type { AssetMetadata } from './utils/storyProtocol'
import './App.css'
import '@rainbow-me/rainbowkit/styles.css'

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mint' | 'assets' | 'debug'>('mint')
  const isDevelopment = import.meta.env.DEV
  const { 
    mintAsset, 
    loading, 
    error, 
    txStatus, 
    txHash, 
    mintedAssets, 
    supabaseAssets,
    walletGroups,
    walletPILTerms,
    assetsLoading,
    loadSupabaseAssets,
    isConnected,
    resetTransactionStatus 
  } = useStoryProtocol()

  const handleMintAsset = async (metadata: AssetMetadata, fileUrl: string, fileHash: string) => {
    try {
      await mintAsset(metadata, fileUrl, fileHash)
      // Will automatically switch to assets tab after successful transaction
    } catch (err) {
      console.error('Minting failed:', err)
    }
  }

  const handleTransactionClose = () => {
    resetTransactionStatus()
    if (txStatus === 'success') {
      setActiveTab('assets') // Switch to assets tab after successful mint
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎨 Story Protocol Asset Minting</h1>
          <p>Register and mint your intellectual property as digital assets</p>
          <WalletConnect />
        </div>
      </header>

      {!isConnected ? (
        <div className="connection-prompt">
          <div className="prompt-content">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to start minting IP assets on Story Protocol</p>
          </div>
        </div>
      ) : (
        <main className="app-main">
          <WalletStatus />
          <nav className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'mint' ? 'active' : ''}`}
              onClick={() => setActiveTab('mint')}
            >
              Mint Asset
            </button>
            <button
              className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              My Assets ({supabaseAssets.length + mintedAssets.length})
              {assetsLoading && <span className="loading-indicator">⏳</span>}
            </button>
            {isDevelopment && (
              <button
                className={`tab-btn ${activeTab === 'debug' ? 'active' : ''}`}
                onClick={() => setActiveTab('debug')}
                style={{ backgroundColor: '#ffeaa7', color: '#2d3436' }}
              >
                🔧 Debug
              </button>
            )}
          </nav>

          <div className="tab-content">
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            {activeTab === 'mint' && (
              <div className="mint-tab">
                <h2>Mint New IP Asset</h2>
                <EnhancedAssetForm onSubmit={handleMintAsset} loading={loading} />
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="assets-tab">
                {isConnected ? (
                  <>
                    <div className="wallet-assets-summary">
                      <h3>Wallet Assets Summary</h3>
                      <div className="summary-stats">
                        <div className="stat-item">
                          <span className="stat-number">{supabaseAssets.length}</span>
                          <span className="stat-label">IP Assets</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">{walletGroups.length}</span>
                          <span className="stat-label">Groups</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-number">{walletPILTerms.length}</span>
                          <span className="stat-label">PIL Terms</span>
                        </div>
                      </div>
                    </div>
                    <AssetListWithSupabase 
                      localAssets={mintedAssets} 
                      supabaseAssets={supabaseAssets}
                      walletGroups={walletGroups}
                      walletPILTerms={walletPILTerms}
                      loading={assetsLoading}
                      onLoadSupabaseAssets={loadSupabaseAssets}
                    />
                  </>
                ) : (
                  <div className="wallet-connection-prompt">
                    <h3>Connect Your Wallet</h3>
                    <p>Please connect your wallet to view your IP assets, groups, and license artifacts.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'debug' && isDevelopment && (
              <div className="debug-tab">
                <h2>🔧 Supabase Debug & Setup</h2>
                <p>Use this tool to diagnose and fix Supabase configuration issues.</p>
                <SupabaseDebugger />
                
                <div style={{ 
                  marginTop: '2rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4>📚 Setup Instructions</h4>
                  <p>If you're experiencing upload errors, check the <strong>SUPABASE_SETUP.md</strong> file for detailed setup instructions.</p>
                  <p>You can also check the browser console for detailed error logs when uploads fail.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      <footer className="app-footer">
        <p>
          Powered by{' '}
          <a href="https://story.foundation" target="_blank" rel="noopener noreferrer">
            Story Protocol
          </a>{' '}
          | Built with React & TypeScript
        </p>
      </footer>

      <TransactionStatus
        status={txStatus}
        txHash={txHash}
        error={error || undefined}
        onClose={handleTransactionClose}
      />
    </div>
  )
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}

export default App
