import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';

// The build's identity, used to decide whether to offer adding the app to the home screen
// again: iOS freezes the icon and the standalone flag at the moment the shortcut is
// created, so a shortcut made from an older build keeps the older icon forever. Vercel
// exposes the commit as an env var; a local build falls back to git, then to the date.
const appVersion =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  (() => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  })();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
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
