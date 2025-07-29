import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '.trycloudflare.com', // Allow all Cloudflare tunnel subdomains
      'localhost',
      '127.0.0.1',
      'baldersandstrom.com'
    ]
  }
})
