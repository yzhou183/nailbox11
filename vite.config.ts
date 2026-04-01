/**
 * vite.config.ts — Vite build tool configuration for Nail Box
 *
 * This file controls:
 *  1. Plugins: React fast-refresh and PWA (Progressive Web App) support
 *  2. Dev server proxy: forwards /api requests to the local Express backend
 *     so the frontend never has to deal with CORS during local development
 *
 * In production (Vercel), VITE_API_URL is set to the Railway backend URL
 * so the proxy is not used — it only applies when running `npm run dev`.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // Enables React Fast Refresh (hot-reloading without losing component state)
    // and transforms JSX/TSX via Babel during development.
    react(),

    /**
     * VitePWA — generates a Web App Manifest and a Workbox service worker
     * so the admin page can be installed as a native-like app on iOS/Android.
     */
    VitePWA({
      /**
       * 'autoUpdate' means the service worker silently installs the newest
       * version in the background and activates it on the next page load.
       * This is preferred over 'prompt' (which would require the user to
       * manually accept the update) for a single-user admin dashboard.
       */
      registerType: 'autoUpdate',

      /**
       * Static files in /public that must be pre-cached by the service worker
       * at install time. These are the PWA icons referenced in the manifest.
       * They are listed explicitly because the pattern-based globbing below
       * does not catch files that are not imported by any JS/CSS module.
       */
      includeAssets: ['icon-192.svg', 'icon-512.svg', 'apple-touch-icon.svg'],

      /**
       * Web App Manifest — the JSON metadata file browsers read to decide
       * how to display the app when installed on a home screen.
       */
      manifest: {
        // Full app name shown in splash screens and app stores.
        name: 'Nail Box Admin',
        // Shortened name shown under the home-screen icon (space is limited).
        short_name: 'Nail Box',
        description: 'Nail Box 预约管理后台',
        // Browser chrome color (address bar, task switcher) on Android Chrome.
        theme_color: '#e8789a',
        // Background color shown during the splash screen before React hydrates.
        background_color: '#fff8fa',
        /**
         * 'standalone' hides the browser UI (address bar, back button) so the
         * app feels like a native application. Other options: 'fullscreen',
         * 'minimal-ui', 'browser'.
         */
        display: 'standalone',
        // Lock the app to portrait mode; nail management doesn't need landscape.
        orientation: 'portrait',
        // Navigation scope: only URLs under '/' are considered part of the app.
        scope: '/',
        /**
         * The URL opened when the user taps the installed icon.
         * Points directly to /admin so the owner lands on the dashboard,
         * not the public-facing landing page.
         */
        start_url: '/admin',
        icons: [
          // 192x192 is the minimum required by Chrome's PWA install criteria.
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          /**
           * 512x512 is used for splash screens.
           * 'maskable' tells the OS it may crop the icon into a circle or
           * squircle (as required by Android adaptive icons). 'any' allows
           * use without masking as well.
           */
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },

      /**
       * Workbox configuration — controls what the service worker caches
       * and how it responds to network requests.
       */
      workbox: {
        /**
         * Pre-cache patterns: all JS bundles, CSS, HTML, SVGs, and web fonts
         * are cached at service-worker install time so the shell loads
         * instantly even on a slow or offline connection.
         */
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],

        /**
         * Runtime caching rules: applied to requests that happen during
         * normal app usage (not pre-cached at install time).
         */
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheet and font files.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            /**
             * 'CacheFirst': serve from cache if available; only go to the
             * network if the resource is not in cache. Ideal for fonts
             * because they are immutable — the URL changes when the font
             * file changes.
             */
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                // Keep at most 10 font entries (one per typeface/weight).
                maxEntries: 10,
                // Expire cached fonts after 1 year (365 * 24 * 60 * 60 seconds).
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],

  /**
   * Dev-server configuration (only applies when running `npm run dev`).
   *
   * The proxy rewrites any request starting with /api so it goes to the
   * local Express backend on port 3001 instead of Vite's own port 5173.
   * This avoids CORS errors during development without having to run
   * both servers on the same port or configure CORS headers for localhost.
   */
  server: {
    proxy: {
      '/api': {
        // All /api/* requests are forwarded to the Express server.
        target: 'http://localhost:3001',
        /**
         * changeOrigin: true rewrites the Host header in the proxied
         * request to match the target host (localhost:3001). Required
         * for virtual-hosted backends and avoids certain CORS rejections.
         */
        changeOrigin: true,
      },
    },
  },
})
