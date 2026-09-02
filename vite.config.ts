import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Only the libraries the app shell genuinely needs on first paint get a fixed
        // chunk (they are stable, so they stay cached across deploys). Everything else —
        // recharts and the form stack above all — is left to Rollup, which keeps it in
        // the async graph of the lazy routes that actually import it.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react';
          }
          if (id.includes('@supabase')) return 'supabase';
          if (/i18next/.test(id)) return 'i18n';
          return;
        },
      },
    },
  },
});
