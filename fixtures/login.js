// @ts-check
import { test as base } from '@playwright/test';
import { login } from '../src/auth-client.js';

/** @type {import('@playwright/test').TestType<{ apiAuth: import('@playwright/test').APIRequestContext }, {}>} */
export const test = base.extend({
  apiAuth: async ({ request }, use) => {
    await login();
    await use(request);
  },
});

export { expect } from '@playwright/test';
