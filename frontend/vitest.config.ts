import { defineConfig } from 'vitest/config'

// Unit tests only — no DOM required, so the default `node` environment is used.
// Kept in a separate file from vite.config.ts so the production build
// (`tsc -b && vite build`) never depends on vitest being installed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:8081/api',
    },
  },
})
