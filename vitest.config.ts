import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Separate from vite.config.ts on purpose. The default environment stays 'node' — most
// tests here are plain functions over src/utils and src/services and don't need a DOM,
// and node is noticeably faster. A component test opts into jsdom with a
// `@vitest-environment jsdom` docblock at the top of its file. Shares the same `@/*`
// alias as the app itself.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  define: {
    // Tests import the same modules the app does; without this the version constant
    // injected at build time would be an undefined global.
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    environment: 'node',
    // jsdom refuses localStorage on an opaque origin, so the DOM tests need a real one.
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000' },
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
