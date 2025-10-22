import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/execute': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})


