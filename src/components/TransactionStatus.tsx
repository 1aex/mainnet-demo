import React from 'react'
import { getTransactionUrl, getIPAssetUrl } from '../utils/storyExplorerUrls'

interface TransactionStatusProps {
  status: 'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'error'
  txHash?: string
  ipAssetId?: string
  error?: string
  onClose: () => void
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  txHash,
  ipAssetId,
  error,
  onClose
}) => {
  if (status === 'idle') return null

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
        return '⏳'
      case 'signing':
        return '✍️'
      case 'pending':
        return '⏳'
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏳'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing transaction...'
      case 'signing':
        return 'Please sign the transaction in your wallet'
      case 'pending':
        return 'Transaction pending confirmation...'
      case 'success':
        return 'Transaction successful!'
      case 'error':
        return 'Transaction failed'
      default:
        return 'Processing...'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#28a745'
      case 'error':
        return '#dc3545'
      default:
        return '#667eea'
    }
  }

  return (
    <div className="transaction-overlay">
      <div className="transaction-modal">
        <div className="transaction-header">
          <h3>Transaction Status</h3>
          {(status === 'success' || status === 'error') && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="transaction-content">
          <div 
            className="status-icon" 
            style={{ color: getStatusColor() }}
          >
            {getStatusIcon()}
          </div>
          
          <div className="status-message">
            <h4 style={{ color: getStatusColor() }}>
              {getStatusMessage()}
            </h4>
            
            {status === 'signing' && (
              <div className="wallet-prompt">
                <p><strong>🔔 Action Required:</strong></p>
                <p>Check your wallet extension (MetaMask/etc.) and approve the transaction to continue.</p>
                <p className="wallet-hint">💡 If you don't see a popup, click your wallet extension icon.</p>
              </div>
            )}
            
            {status === 'pending' && txHash && (
              <div className="tx-details">
                <p>Transaction Hash:</p>
                <a
                  href={getTransactionUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                </a>
              </div>
            )}
            
            {status === 'success' && (
              <div className="tx-details">
                <p>Your IP asset has been successfully minted and registered!</p>
                {ipAssetId && (
                  <a
                    href={getIPAssetUrl(ipAssetId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View IP Asset on Explorer
                  </a>
                )}
                {txHash && (
                  <a
                    href={getTransactionUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                    style={{ marginLeft: '10px' }}
                  >
                    View Transaction
                  </a>
                )}
              </div>
            )}
            
            {status === 'error' && error && (
              <div className="error-details">
                <p className="error-message">{error}</p>
              </div>
            )}
          </div>

          {(status === 'preparing' || status === 'pending') && (
            <div className="progress-spinner">
              <div className="spinner"></div>
            </div>
          )}
          
          {status === 'signing' && (
            <div className="wallet-animation">
              <div className="wallet-icon">👛</div>
              <div className="pulse-ring"></div>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="transaction-actions">
            <button className="retry-btn" onClick={onClose}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionStatus