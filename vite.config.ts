
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/fadas/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
