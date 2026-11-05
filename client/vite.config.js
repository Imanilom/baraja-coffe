import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Warning: When using ngrok, ensure that the tunnel is active.
 * The target URL will change every time you restart ngrok.
 * Update the target URL accordingly to avoid connection issues.
 */

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        // target: 'https://equisetic-nonvendibly-benny.ngrok-free.dev',
        target: 'https://app.barajacoffee.site',
        // target: 'http://localhost:3000',
        changeOrigin: true, // Tambahkan ini untuk mengatasi masalah CORS
        secure: false, // Set ke false jika menggunakan HTTP
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      },
    },
  },
  plugins: [react()],
});