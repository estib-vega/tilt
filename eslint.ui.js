import tanstackQuery from '@tanstack/eslint-plugin-query';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import parser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';

/**
 * @type {import('eslint').Linter.Config}
 */
const uiConfig = {
  name: 'UI',
  languageOptions: {
    parser,
    parserOptions: {
      project: './tsconfig.ui.json',
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      React: true,
    },
  },
  plugins: {
    '@tanstack/query': tanstackQuery,
    'react-hooks': reactHooks,
    '@typescript-eslint': tseslint,
  },
  rules: {
    ...tanstackQuery.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    'no-unused-vars': 'off', // handled by TS
  },
  ignores: [
    'src/ui/components/ai-elements/**',
    'src/ui/components/ui/**',
    'src/ui/routeTree.gen.ts',
  ],
};

export default uiConfig;
