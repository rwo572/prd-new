import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('development')
  },
  resolve: {
    alias: {
      // Provide browser-compatible versions
      'process': 'process/browser',
      'buffer': 'buffer'
    }
  },
  optimizeDeps: {
    include: ['process', 'buffer'],
    esbuildOptions: {
      // Define global for browser compatibility
      define: {
        global: 'globalThis',
      }
    }
  }
})
