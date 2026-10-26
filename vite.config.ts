import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the build works on any static host,
// including hosts that serve the app from a sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  // The bundled peptide library text is most of the JS, and the app is offline-first, so one chunk is fine.
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'node',
  },
});
