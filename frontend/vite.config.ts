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
    sourcemap: true,
  },
});
