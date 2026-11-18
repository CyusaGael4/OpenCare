import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail loudly instead of silently moving to 5174 and breaking the API proxy/CORS allowlist.
    strictPort: true,
    /*
     * In development the browser talks to Vite only, and Vite forwards /api to
     * Express. That keeps requests same-origin, so the session cookie is sent
     * without needing SameSite=None or a third-party cookie exception.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
