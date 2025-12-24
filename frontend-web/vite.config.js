import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@componentes': path.resolve(__dirname, './src/componentes'),
      '@paginas': path.resolve(__dirname, './src/paginas'),
      '@servicios': path.resolve(__dirname, './src/servicios'),
      '@utilidades': path.resolve(__dirname, './src/utilidades'),
      '@contextos': path.resolve(__dirname, './src/contextos'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
        },
      },
    },
  },
})
