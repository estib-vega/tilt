import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

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
    files: ['src/electron/**/*.ts'],
    ...(await import('./eslint.electron.js')).default,
    name: 'Electron Config',
  },
  // Electron JS override
  {
    files: ['src/electron/**/*.js'],
    name: 'Electron JS Config',
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      },
    },
  },
]);
