import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' au lieu de 'autoUpdate' : on contrôle finement le moment du
      // reload via un banner (src/components/layout/UpdatePrompt.jsx).
      // `autoUpdate` installait silencieusement le nouveau SW mais ne
      // rechargeait pas la page — les utilisateurs gardaient l'ancien bundle.
      registerType: 'prompt',
      includeAssets: [
        'icons/favicon.ico',
        'icons/apple-touch-icon.png',
        'icons/apple-touch-icon-3d.png',
        'icons/logo16.png',
        'icons/logo32.png',
        'icons/logo48.png',
        'icons/logo64.png',
        'icons/logo96.png',
        'icons/logo128.png',
        'icons/logo192.png',
        'icons/logo256.png',
        'icons/logo384.png',
        'icons/logo512.png',
      ],
      manifest: {
        name: 'Parenty',
        short_name: 'Parenty',
        description: 'Organisation parentale partagée, simple et factuelle',
        theme_color: '#00685f',
        background_color: '#f8f9ff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        icons: [
          {
            src: '/icons/logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/logo256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/logo384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Purge les anciens caches générés par les builds précédents —
        // sinon on accumule MBo sur l'appareil de l'utilisateur.
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 jour
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
})
