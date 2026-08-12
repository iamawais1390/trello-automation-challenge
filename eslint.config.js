// @ts-check
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default defineConfig([
  {
    files: ['**/*.js'],
    ignores: ['node_modules', 'test-results', 'playwright-report'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Playwright fixtures use `async ({}, use) => {...}` for fixtures with no dependencies.
      'no-empty-pattern': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // Assertions go through assertions/assert.js's `Assert.assert*` wrapper, not raw expect().
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'assertIsOk',
            'assertHasStatus',
            'assertIsTruthy',
            'assertAreEqual',
            'assertAreNotEqual',
            'assertContains',
            'assertResponseTime',
          ],
        },
      ],
    },
  },
]);
