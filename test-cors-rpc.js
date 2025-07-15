// Test Story Protocol RPC endpoints for CORS compatibility
async function testCORSCompatibility() {
  console.log('🔍 Testing Story Protocol RPC endpoints for browser compatibility...')
  
  const endpoints = [
    // Mainnet endpoints
    { name: 'Story Foundation Official', url: 'https://rpc.story.foundation', chain: 'mainnet' },
    { name: 'Validatrium', url: 'https://story-rpc.validatrium.club', chain: 'mainnet' },
    { name: 'KJ Nodes', url: 'https://story.rpc.kjnodes.com', chain: 'mainnet' },
    { name: 'Nodeist', url: 'https://rpc-story.nodeist.net', chain: 'mainnet' },
    { name: 'ITRocket', url: 'https://story-rpc.itrocket.net', chain: 'mainnet' },
    
    // Testnet endpoints
    { name: 'Iliad Testnet', url: 'https://testnet.storyrpc.io', chain: 'testnet' },
    { name: 'Odyssey Testnet', url: 'https://odyssey.storyrpc.io', chain: 'testnet' },
  ]

  console.log('Testing endpoints for CORS headers...\n')

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name} (${endpoint.chain})...`)
      console.log(`URL: ${endpoint.url}`)
      
      // Test with a simple GET request first to check CORS headers
      const response = await fetch(endpoint.url, {
        method: 'HEAD', // Use HEAD to minimize data transfer
        mode: 'cors'
      })
      
      console.log(`Status: ${response.status}`)
      console.log('CORS Headers:')
      console.log(`  Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin') || 'Not present'}`)
      console.log(`  Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods') || 'Not present'}`)
      console.log(`  Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers') || 'Not present'}`)
      
      // If HEAD request works, try a JSON-RPC call
      if (response.ok || response.status === 405) { // 405 = Method Not Allowed is OK
        console.log('Attempting JSON-RPC call...')
        
        const rpcResponse = await fetch(endpoint.url, {
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
        
        if (rpcResponse.ok) {
          const data = await rpcResponse.json()
          const chainId = data.result ? parseInt(data.result, 16) : 'Unknown'
          console.log(`✅ SUCCESS! Chain ID: ${chainId}`)
          
          if (endpoint.chain === 'mainnet' && chainId === 1516) {
            console.log(`🎯 RECOMMENDED: ${endpoint.name} works for mainnet!`)
          } else if (endpoint.chain === 'testnet') {
            console.log(`🧪 TESTNET OPTION: ${endpoint.name} works for testing`)
          }
        } else {
          console.log(`❌ JSON-RPC failed: ${rpcResponse.status}`)
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)
      
      if (error.message.includes('CORS')) {
        console.log('   Reason: CORS policy blocks browser requests')
      } else if (error.message.includes('fetch failed')) {
        console.log('   Reason: Network error or endpoint unreachable')
      }
    }
    
    console.log('---')
  }
  
  console.log('\n📋 Summary and Recommendations:')
  console.log('Most Story Protocol RPC endpoints do not allow direct browser access due to CORS policies.')
  console.log('\nOptions:')
  console.log('1. Use a proxy server to bypass CORS')
  console.log('2. Use testnet endpoints if they allow CORS')
  console.log('3. Set up your own RPC proxy')
  console.log('4. Use a Web3 provider like MetaMask to handle RPC calls')
}

testCORSCompatibility()