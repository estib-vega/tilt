import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import globals from 'globals';
import importEslint from 'eslint-plugin-import';

/**
 * @type {import('eslint').Linter.Config}
 */
const electronConfig = {
  name: 'Electron',
  languageOptions: {
    parser,
    parserOptions: {
      project: './tsconfig.electron.json',
    },
    globals: {
      ...globals.nodeBuiltin,
    },
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.electron.json',
        alwaysTryTypes: true,
      },
    },
  },
  plugins: {
    '@typescript-eslint': ts,
    import: importEslint,
  },
  rules: {
    'no-console': 'off', // common for electron main,
    'no-unused-vars': 'off', // handled by TS
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
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
    'import/extensions': [
      'error',
      'always',
      {
        ignorePackages: true,
        pattern: {
          ts: 'never',
          tsx: 'never',
          js: 'always',
          jsx: 'always',
        },
      },
    ],
  },
};

export default electronConfig;
