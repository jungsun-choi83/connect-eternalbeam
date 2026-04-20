import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const siteHost = 'connect.eternalbeam.com'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [siteHost, '.eternalbeam.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: [siteHost, '.eternalbeam.com'],
    port: 4173,
  },
})
