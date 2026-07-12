/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

const resolvePath = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@components': resolvePath('./src/components'),
      '@pages': resolvePath('./src/pages'),
      '@store': resolvePath('./src/store'),
      '@services': resolvePath('./src/services'),
      '@hooks': resolvePath('./src/hooks'),
      '@types': resolvePath('./src/types'),
      '@lib': resolvePath('./src/lib'),
      '@features': resolvePath('./src/features'),
      '@utils': resolvePath('./src/utils'),
      '@validations': resolvePath('./src/validations'),
      '@routes': resolvePath('./src/routes'),
      '@config': resolvePath('./src/config'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Sourcemaps are handy for prod debugging but add build time/size;
    // browsers only fetch them on demand from devtools, so they're free at runtime.
    sourcemap: true,
    // Splitting stable, rarely-changing dependencies into their own chunk
    // means the browser can cache them across deploys — a release that
    // only touches app code won't invalidate the vendor chunk's cache entry.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-devtools', 'axios'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['node_modules', 'dist'],
  },
});
