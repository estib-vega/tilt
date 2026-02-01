import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  globalIgnores(['dist-electron/**', 'dist-ui/**', 'node_modules/**']),

  // UI override
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    ...(await import('./eslint.ui.js')).default,
  },

  // Electron override
  {
    files: ['src/electron/**/*.{ts,js}'],
    ...(await import('./eslint.electron.js')).default,
    name: 'Electron Config',
  },
]);
