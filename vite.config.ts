import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ipWhitelistAuth from './ipWhitelistMiddleware.mjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ip-whitelist-middleware',
      // Este hook garante que o middleware seja o primeiro a ser executado
      configureServer(server) {
        server.middlewares.use('/', ipWhitelistAuth);
      },
      // Adicionar também ao servidor de preview para consistência após o build
      configurePreviewServer(server) {
        server.middlewares.use('/', ipWhitelistAuth);
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true,
  },
});
