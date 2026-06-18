import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuración de Vite para la app móvil (Capacitor empaqueta la carpeta dist/)
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
    port: 5174,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
