import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    base: isProd ? '/Nexus-HEMS-Dash/' : '/',

    plugins: [
      // React Compiler auto-memoizes components — replaces manual memo/useMemo/useCallback
      // Uses Babel (not SWC) because React Compiler is a Babel-only plugin
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]],
        },
      }),

      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: false, // Use public/manifest.json
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/bundle-stats.html'],
          navigateFallback: isProd ? '/Nexus-HEMS-Dash/index.html' : 'index.html',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.open-meteo\.com\//,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'weather-api',
                expiration: { maxEntries: 50, maxAgeSeconds: 86_400 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/api\.tibber\.com\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'tibber-api',
                expiration: { maxEntries: 50, maxAgeSeconds: 3_600 },
                networkTimeoutSeconds: 8,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/api\.awattar\.(de|at)\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'awattar-api',
                expiration: { maxEntries: 50, maxAgeSeconds: 3_600 },
                networkTimeoutSeconds: 8,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gemini-api',
                expiration: { maxEntries: 20, maxAgeSeconds: 3_600 },
                networkTimeoutSeconds: 10,
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 31_536_000 },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 150, maxAgeSeconds: 2_592_000 },
              },
            },
            {
              urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 31_536_000 },
              },
            },
            {
              urlPattern: /\/manifest\.json$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'manifest',
                expiration: { maxEntries: 1, maxAgeSeconds: 86_400 },
              },
            },
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: { enabled: false, type: 'module' },
      }),

      // Bundle analyzer — only in production, generates dist/bundle-stats.html
      isProd &&
        visualizer({
          filename: 'dist/bundle-stats.html',
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // Pre-bundle heavy deps for instant dev startup
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'd3',
        'd3-sankey',
        'motion',
        'recharts',
        'zustand',
        'i18next',
        'react-i18next',
        'dexie',
        'lucide-react',
        '@tanstack/react-query',
      ],
    },

    build: {
      target: 'es2022',
      cssCodeSplit: true,
      reportCompressedSize: true,

      rollupOptions: {
        output: {
          // Deterministic short hashes for long-term caching
          chunkFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8][extname]',

          // Function-based manualChunks avoids circular-reference warnings
          // and gives finer control than object syntax
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // Framework core — loaded on every page
            if (/\/react\/|\/react-dom\/|\/scheduler\/|\/react-router/.test(id)) return 'framework';

            // D3 visualization — only Sankey + EnergyFlow pages
            if (/\/d3[-/]|\/d3-sankey\//.test(id)) return 'vendor-d3';

            // Recharts — Analytics, Monitoring, Tariffs pages
            if (/\/recharts\/|\/victory/.test(id)) return 'vendor-recharts';

            // Animation engine
            if (/\/motion\//.test(id)) return 'vendor-motion';

            // Internationalization
            if (/\/i18next/.test(id)) return 'vendor-i18n';

            // Icons (tree-shaken)
            if (id.includes('/lucide-react/')) return 'vendor-icons';

            // React Query + Devtools
            if (id.includes('/@tanstack/')) return 'vendor-query';

            // QR code — only ExportAndSharing
            if (id.includes('/qrcode/')) return 'vendor-qrcode';

            // Date utilities — used in analytics/monitoring
            if (id.includes('/date-fns/')) return 'vendor-date';

            // State + storage
            if (/\/zustand\/|\/dexie\//.test(id)) return 'vendor-state';

            // Google Gemini AI — only AI pages
            if (id.includes('/@google/genai/')) return 'vendor-ai';

            // Everything else
            if (/\/clsx\/|\/tailwind-merge\//.test(id)) return 'vendor-utils';
          },
        },
      },
    },

    // Web Workers use ES modules for tree-shaking
    worker: {
      format: 'es',
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
