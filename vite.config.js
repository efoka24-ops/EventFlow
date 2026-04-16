import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  server: {
    proxy: {
      '/storage/events': {
        target: 'https://jsonblob.com',
        changeOrigin: true,
        rewrite: () => '/api/jsonBlob/019d9725-a658-795a-9147-e17fd51f5207',
      },
      '/storage/registrations': {
        target: 'https://jsonblob.com',
        changeOrigin: true,
        rewrite: () => '/api/jsonBlob/019d9725-aa52-7c74-9281-2ce60fe6471f',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
  ]
});