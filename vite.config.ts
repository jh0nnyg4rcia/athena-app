import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Nunca injete GEMINI_API_KEY / VITE_GEMINI_* no bundle. Chave só no processo Node.
    'process.env.GEMINI_API_KEY': JSON.stringify(''),
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(''),
    '__ATHENA_BUILD_API_KEY__': JSON.stringify(''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
