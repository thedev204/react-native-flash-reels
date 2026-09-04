import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      'lib/**',
      'coverage/**',
      '.turbo/**',
      '.yarn/**',
      'example/android/**',
      'example/ios/**',
      'example/vendor/**',
      'website/build/**',
      'website/.docusaurus/**',
      'website/node_modules/**',
    ],
  },
  {
    // Docusaurus uses its own toolchain — skip RN ESLint on that tree.
    ignores: ['website/**'],
  },
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.{test,spec}.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);
