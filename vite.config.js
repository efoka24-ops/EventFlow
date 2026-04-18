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
        rewrite: () => '/api/jsonBlob/019d9ff9-b1f7-7842-82b4-f09c06db506c',
      },
      '/storage/registrations': {
        target: 'https://jsonblob.com',
        changeOrigin: true,
        rewrite: () => '/api/jsonBlob/019d9ffa-ce4b-756e-94a4-de4a31a8e47a',
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
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