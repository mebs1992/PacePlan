import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const isNativeWebView = process.env.NATIVE_WEBVIEW === '1';

export default defineConfig({
  base: isNativeWebView ? './' : '/',
  build: isNativeWebView
    ? {
        outDir: path.resolve(__dirname, 'PacePlan/PacePlan/WebApp'),
        emptyOutDir: true,
      }
    : undefined,
  plugins: [
    react(),
    !isNativeWebView &&
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Hangover Buddy',
          short_name: 'Buddy',
          description: 'Pace your drinking. Skip the hangover.',
          theme_color: '#FFF8F1',
          background_color: '#FFF8F1',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
