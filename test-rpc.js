// Test Story Protocol mainnet RPC functionality
import { createPublicClient, http } from 'viem'

const mainnetRPC = 'https://rpc.story.foundation'
const chainId = 1516

async function testRPCConnection() {
  console.log('🔍 Testing Story Protocol mainnet RPC...')
  console.log('RPC URL:', mainnetRPC)
  console.log('Chain ID:', chainId)
  console.log('')

  try {
    // Test basic HTTP request to RPC
    console.log('1️⃣ Testing basic HTTP connectivity...')
    const response = await fetch(mainnetRPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Basic connectivity successful')
    console.log('Response:', data)

    // Convert hex chain ID to decimal
    if (data.result) {
      const receivedChainId = parseInt(data.result, 16)
      console.log(`📊 Chain ID: ${receivedChainId} (expected: ${chainId})`)
      
      if (receivedChainId === chainId) {
        console.log('✅ Chain ID matches!')
      } else {
        console.log('❌ Chain ID mismatch!')
      }
    }

    // Test with viem client
    console.log('\n2️⃣ Testing with viem client...')
    const publicClient = createPublicClient({
      transport: http(mainnetRPC)
    })

    // Test getting block number
    console.log('Getting latest block number...')
    const blockNumber = await publicClient.getBlockNumber()
    console.log('✅ Latest block:', blockNumber.toString())

    // Test getting chain ID
    console.log('Getting chain ID via viem...')
    const viemChainId = await publicClient.getChainId()
    console.log('✅ Chain ID via viem:', viemChainId)

    console.log('\n🎉 RPC connection test successful!')
    console.log('The mainnet RPC is functional and ready to use.')

  } catch (error) {
    console.error('❌ RPC connection test failed:')
    console.error('Error:', error.message)
    
    if (error.message.includes('CORS')) {
      console.log('\n🔧 CORS issue detected. Possible solutions:')
      console.log('1. Use a different RPC endpoint that allows browser requests')
      console.log('2. Use a proxy server')
      console.log('3. Consider using Story Protocol testnet instead')
    }
    
    return false
  }
}

// Test alternative RPC endpoints if mainnet fails
async function testAlternativeRPCs() {
  console.log('\n🔄 Testing alternative RPC endpoints...')
  
  const alternatives = [
    'https://story-rpc.validatrium.club',
    'https://story.rpc.kjnodes.com',
    'https://rpc-story.nodeist.net',
    'https://story-rpc.itrocket.net'
  ]

  for (const rpc of alternatives) {
    try {
      console.log(`\nTesting: ${rpc}`)
      const response = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      })

      if (response.ok) {
        const data = await response.json()
        const chainId = parseInt(data.result, 16)
        console.log(`✅ ${rpc} - Chain ID: ${chainId}`)
        
        if (chainId === 1516) {
          console.log(`🎯 Found working mainnet RPC: ${rpc}`)
          return rpc
        }
      }
    } catch (error) {
      console.log(`❌ ${rpc} - Failed: ${error.message}`)
    }
  }
  
  return null
}

// Run tests
testRPCConnection()
  .then(success => {
    if (!success) {
      return testAlternativeRPCs()
    }
  })
  .then(alternativeRPC => {
    if (alternativeRPC) {
      console.log(`\n💡 Recommendation: Use ${alternativeRPC} as your RPC URL`)
    } else {
      console.log('\n❌ No working mainnet RPC endpoints found that allow browser requests')
    }
  })
  .catch(error => {
    console.error('Test failed:', error)
  })