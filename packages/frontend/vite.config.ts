import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@voip/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  define: {
    'import.meta.env': 'import.meta.env',
    __API_BASE__: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})