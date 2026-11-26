import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// Ausgeliefert unter https://anorren.github.io/ml-fuer-schueler/ (DEC-09).
// Browser-Zielversion vorläufig Safari 14; endgültig nach OQ-04 (Gerätedaten der Schul-iPads).
export default defineConfig({
  base: '/ml-fuer-schueler/',
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  build: { target: ['safari14', 'es2020'] },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt', // DEC-03: neue Version nur mit Hinweis „Update verfügbar“
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Machine Learning für Schüler',
        short_name: 'ML Schule',
        lang: 'de',
        description: 'Maschinelles Lernen ausprobieren, ohne Konto und offline.',
        start_url: '/ml-fuer-schueler/',
        scope: '/ml-fuer-schueler/',
        display: 'standalone',
        background_color: '#f9f9f7',
        theme_color: '#2670cc',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,json}'] }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
