import { defineConfig } from 'vitest/config';
import path from 'path';

// Separate from vite.config.ts on purpose: these are plain-function unit tests over
// src/utils and src/services, no DOM needed, so a 'node' environment is enough and
// noticeably faster than jsdom. Shares the same `@/*` alias as the app itself.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
