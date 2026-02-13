import tanstackQuery from '@tanstack/eslint-plugin-query';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import parser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import importEslint from 'eslint-plugin-import';

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
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.ui.json',
        alwaysTryTypes: true,
      },
    },
  },
  plugins: {
    '@tanstack/query': tanstackQuery,
    'react-hooks': reactHooks,
    '@typescript-eslint': tseslint,
    import: importEslint,
  },
  rules: {
    ...tanstackQuery.configs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    'no-unused-vars': 'off', // handled by TS
    'import/order': [
      'error',
      {
        groups: [
          // Imports of builtins are first
          'builtin',
          // Then sibling and parent imports. They can be mingled together
          ['sibling', 'parent'],
          // Then index file imports
          'index',
          // Then any arcane TypeScript imports
          'object',
          // Then the omitted imports: internal, external, type, unknown
        ],
      },
    ],
  },
  ignores: [
    'src/ui/components/ai-elements/**',
    'src/ui/components/ui/**',
    'src/ui/routeTree.gen.ts',
  ],
};

export default uiConfig;
