// @ts-check
import { faker } from '@faker-js/faker';
import { test as base } from './login.js';

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & {
 *     apiAuth: import('@playwright/test').APIRequestContext,
 *     boardName: string,
 *     randomListName: () => string,
 *     randomCardName: () => string,
 *   },
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
export const test = base.extend({
  boardName: async ({}, use) => {
    await use(`automation-test-${faker.word.noun()}-${faker.string.alphanumeric(6)}`);
  },

  // Factories, not fixed values: a single test can need several distinct
  // list/card names (e.g. two lists to move a card between).
  randomListName: async ({}, use) => {
    await use(() => `list-${faker.word.noun()}-${faker.string.alphanumeric(4)}`);
  },

  randomCardName: async ({}, use) => {
    await use(() => `card-${faker.word.noun()}-${faker.string.alphanumeric(4)}`);
  },
});

export { expect } from '@playwright/test';
