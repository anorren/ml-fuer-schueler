import { defineConfig, devices } from '@playwright/test';

// Browsertests mit der Safari-Engine (WebKit) im iPad-Format (DEC-10). Ein echtes Schul-iPad ersetzt das nicht.
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run build && npm run preview -- --port 4321 --strictPort', url: 'http://localhost:4321/ml-fuer-schueler/', reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: 'http://localhost:4321/ml-fuer-schueler/' },
  projects: [{ name: 'iPad (WebKit)', use: { ...devices['iPad (gen 7) landscape'] } }]
});
