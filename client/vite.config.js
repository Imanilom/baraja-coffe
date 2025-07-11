import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        // target: 'https://fdac5c7d3a1f.ngrok-free.app',
        target: 'http://localhost:3000',
        changeOrigin: true, // Tambahkan ini untuk mengatasi masalah CORS
        secure: false, // Set ke false jika menggunakan HTTP
      },
    },
  },
  plugins: [react()],
});