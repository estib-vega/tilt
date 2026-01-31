import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import globals from 'globals';

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
  plugins: {
    '@typescript-eslint': ts,
  },
  rules: {
    'no-console': 'off', // common for electron main,
    'no-unused-vars': 'off', // handled by TS
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};

export default electronConfig;
