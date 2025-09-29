import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

/**
 * Warning: When using ngrok, ensure that the tunnel is active.
 * The target URL will change every time you restart ngrok.
 * Update the target URL accordingly to avoid connection issues.
 */

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        // target: 'https://a00bc682df3b.ngrok-free.app',
        target: 'https://app.barajacoffee.site',
        changeOrigin: true, // Tambahkan ini untuk mengatasi masalah CORS
        secure: false, // Set ke false jika menggunakan HTTP
      },
    },
  },
  plugins: [react()],
});