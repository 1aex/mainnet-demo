import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Reduce memory usage during build
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          story: ['@story-protocol/core-sdk'],
          wallet: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
