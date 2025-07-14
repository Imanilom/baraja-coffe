import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        // target: 'https://a00bc682df3b.ngrok-free.app',
        target: 'http://localhost:3000',
        changeOrigin: true, // Tambahkan ini untuk mengatasi masalah CORS
        secure: false, // Set ke false jika menggunakan HTTP
      },
    },
  },
  plugins: [react()],
});