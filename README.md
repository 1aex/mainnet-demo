# Story Protocol Asset Minting

A React TypeScript application for registering and minting intellectual property assets using the Story Protocol mainnet. This application allows users to upload various types of digital assets (images, PDFs, audio, video) and mint them as IP assets on the Story Protocol blockchain.

## Features

- 🎨 **Multi-format Asset Upload**: Support for images, PDFs, audio, and video files
- 🔗 **IPFS Integration**: Decentralized storage of assets and metadata using Helia (modern IPFS)
- 🌐 **Story Protocol Integration**: Full integration with Story Protocol mainnet for IP asset registration
- 💼 **Wallet Connection**: Support for multiple wallets via RainbowKit
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🎯 **Type Safety**: Built with TypeScript for enhanced development experience

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Web3**: Wagmi, Viem, RainbowKit
- **Storage**: Helia (IPFS)
- **Styling**: Custom CSS with modern design
- **Protocol**: Story Protocol TypeScript SDK

## Prerequisites

- Node.js 16+ and npm
- MetaMask or other Web3 wallet
- Story Protocol mainnet access

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd story-protocol-minting
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### 1. Connect Your Wallet
- Click the "Connect Wallet" button in the header
- Choose your preferred wallet provider
- Ensure you're connected to the Story Protocol mainnet (Chain ID: 1513)

### 2. Upload and Mint Assets

1. **Upload File**: 
   - Drag and drop or click to select files
   - Supported formats: JPG, PNG, GIF, WebP, PDF, MP3, WAV, OGG, MP4, AVI, MOV
   - Maximum file size: 100MB

2. **Fill Asset Details**:
   - Asset Name (required)
   - Description
   - External URL (optional)
   - Custom attributes (key-value pairs)

3. **Mint Asset**:
   - Click "Mint IP Asset"
   - Confirm the transaction in your wallet
   - Wait for the transaction to complete

### 3. View Your Assets
- Switch to the "My Assets" tab
- View all your minted IP assets
- Access IPFS links and external URLs
- See asset metadata and attributes

## Project Structure

```
src/
├── components/          # React components
│   ├── AssetForm.tsx   # Asset creation form
│   ├── AssetList.tsx   # Display minted assets
│   ├── FileUpload.tsx  # File upload component
│   └── WalletConnect.tsx # Wallet connection
├── hooks/              # Custom React hooks
│   └── useStoryProtocol.ts # Story Protocol integration
├── providers/          # Context providers
│   └── Web3Provider.tsx # Web3 configuration
├── utils/              # Utility functions
│   ├── ipfs.ts        # IPFS operations
│   └── storyProtocol.ts # Story Protocol service
├── App.tsx            # Main application component
├── App.css           # Application styles
└── main.tsx          # Application entry point
```

## Configuration

### Story Protocol Network
The application is configured to work with Story Protocol mainnet:
- Chain ID: 1513
- RPC URL: https://rpc.story.foundation
- Explorer: https://explorer.story.foundation

### IPFS Configuration
Using Helia (modern IPFS client) for decentralized storage:
- In-memory datastore and blockstore for demo purposes
- Gateway: https://ipfs.io/ipfs/

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Asset Types

To support additional file types, modify the `SUPPORTED_TYPES` constant in `src/components/FileUpload.tsx`:

```typescript
const SUPPORTED_TYPES = {
  // Add new types here
  newType: ['mime/type']
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- [Story Protocol](https://story.foundation) for the IP protocol
- [Helia](https://helia.io) for IPFS integration
- [RainbowKit](https://rainbowkit.com) for wallet connectivity
- [Vite](https://vitejs.dev) for the build system