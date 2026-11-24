import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { InlineConfig } from 'vitest/node';

interface VitestConfigExport extends UserConfig {
  test?: InlineConfig;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
} as VitestConfigExport);
