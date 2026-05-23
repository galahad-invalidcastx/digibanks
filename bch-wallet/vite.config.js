import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'process', 'util'],
      globals: { Buffer: true, global: true, process: true },
    })
  ],
  resolve: {
    alias: {
      // Ensure proper resolution for @mem-cash packages
      '@mem-cash/validation': '@mem-cash/validation',
      '@mem-cash/types': '@mem-cash/types',
      '@mem-cash/electrum': '@mem-cash/electrum',
    }
  },
  optimizeDeps: {
    rolldownOptions: {   // Replace esbuildOptions with rolldownOptions
      define: { global: 'globalThis' },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit if needed
    rolldownOptions: {
      // If resolution still fails, externalize these modules (not ideal but works)
      // external: ['@mem-cash/electrum', '@mem-cash/validation', '@mem-cash/types']
    }
  },
  define: { 'process.env': {}, global: 'globalThis' },
})