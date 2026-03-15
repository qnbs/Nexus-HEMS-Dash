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
      // React Compiler auto-memoizes — requires Babel (no SWC alternative yet).
      // Babel is limited to React Compiler transform only; esbuild handles
      // the rest of TS/JSX compilation for near-SWC dev speed.
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]],
        },
      }),

      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'icon.svg', 'apple-touch-icon.png'],
        manifest: false, // Use public/manifest.json
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/bundle-stats.html'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
          sourcemap: false,
          navigateFallback: isProd ? '/Nexus-HEMS-Dash/index.html' : 'index.html',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          navigationPreload: true,
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
                cacheableResponse: { statuses: [0, 200] },
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
        /* Ensure old precache entries from previous SW versions are purged */
        selfDestroying: false,
        devOptions: { enabled: false, type: 'module' },
      }),

      // Bundle analyzer — generates dist/bundle-stats.html for Lighthouse audits
      isProd &&
        visualizer({
          filename: 'dist/bundle-stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // treemap view for better chunk analysis
        }),
    ].filter(Boolean),

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
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
        'react/compiler-runtime',
        'd3-selection',
        'd3-sankey',
        'motion/react',
        'recharts',
        'zustand',
        'i18next',
        'react-i18next',
        'dexie',
        'lucide-react',
        '@tanstack/react-query',
        'clsx',
        'tailwind-merge',
      ],
    },

    build: {
      target: 'es2022',
      cssCodeSplit: true,
      reportCompressedSize: true,
      // Modern browsers don't need the modulepreload polyfill (~1.5 KB)
      modulePreload: { polyfill: false },
      // Strip legal comments for smaller output
      minify: 'esbuild',
      // Warn when chunks exceed 150 KB (compressed)
      chunkSizeWarningLimit: 150,

      rollupOptions: {
        output: {
          // Deterministic short hashes for aggressive long-term caching
          chunkFileNames: 'assets/[name]-[hash:8].js',
          entryFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8][extname]',

          // Function-based manualChunks avoids circular-reference warnings
          // and gives finer control than object syntax.
          // Strategy: separate heavy libs into dedicated chunks so pages
          // only download what they actually render.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // ── Framework core — loaded on every page ──
            if (/\/react\/|\/react-dom\/|\/scheduler\/|\/react-router/.test(id)) return 'framework';

            // ── D3 visualization — only Sankey pages ──
            // After tree-shaking: only d3-selection + d3-sankey (~30 KB)
            if (/\/d3[-/]|\/d3-sankey\//.test(id)) return 'vendor-d3';

            // ── Recharts — Analytics, Monitoring, Tariffs pages ──
            if (/\/recharts\/|\/victory/.test(id)) return 'vendor-recharts';

            // ── Animation engine — widely used but tree-shakeable ──
            if (/\/motion\//.test(id)) return 'vendor-motion';

            // ── Internationalization ──
            if (/\/i18next/.test(id)) return 'vendor-i18n';

            // ── Icons (tree-shaken per-icon) ──
            if (id.includes('/lucide-react/')) return 'vendor-icons';

            // ── React Query + Devtools ──
            if (id.includes('/@tanstack/')) return 'vendor-query';

            // ── PDF generation + optional deps — dynamically imported on user action ──
            if (
              /\/jspdf\/|\/html2canvas\/|\/dompurify\/|\/purify|\/canvg\/|\/fflate\/|\/fast-png\//.test(
                id,
              )
            )
              return 'vendor-pdf';

            // ── QR code — dynamically imported on user action ──
            if (id.includes('/qrcode/')) return 'vendor-qrcode';

            // ── Date utilities — analytics/monitoring ──
            if (id.includes('/date-fns/')) return 'vendor-date';

            // ── State + offline storage ──
            if (/\/zustand\/|\/dexie\//.test(id)) return 'vendor-state';

            // ── Google Gemini AI — only AI pages ──
            if (id.includes('/@google/genai/')) return 'vendor-ai';

            // ── Radix UI primitives ──
            if (id.includes('/@radix-ui/')) return 'vendor-radix';

            // ── MQTT — lazy-loaded by VictronMQTTAdapter ──
            if (/\/mqtt\/|mqtt\.js/.test(id)) return 'vendor-mqtt';

            // ── Micro-utilities ──
            if (/\/clsx\/|\/tailwind-merge\//.test(id)) return 'vendor-utils';
          },
        },
      },
    },

    // Strip legal comments from output for smaller bundles
    esbuild: {
      legalComments: 'none',
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
