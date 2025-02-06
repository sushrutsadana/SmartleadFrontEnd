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
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'logo.png') {
            return 'logo.png'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
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
