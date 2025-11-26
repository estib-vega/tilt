import ts from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

export default {
  languageOptions: {
    parser,
    parserOptions: {
      project: './tsconfig.electron.json',
    },
    globals: {
      __dirname: 'readonly',
      process: 'readonly',
    },
  },
  plugins: {
    '@typescript-eslint': ts,
  },
  rules: {
    'no-console': 'off', // common for electron main,
    'no-unused-vars': 'off', // handled by TS
  },
}
