import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
  },
  experimental: {
    renderBuiltUrl(filename) {
      if (filename.includes('favicon.ico')) {
        return '/favicon.ico'
      }
      return filename
    }
  }
})
