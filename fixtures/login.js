// @ts-check
import { test as base } from '@playwright/test';
import { login } from '../src/auth-client.js';

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & {
 *     apiAuth: import('@playwright/test').APIRequestContext,
 *   },
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
export const test = base.extend({
  apiAuth: async ({ request }, use) => {
    await login(request);
    await use(request);
  },
});

export { expect } from '@playwright/test';
