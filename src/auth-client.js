// @ts-check
import { existsSync } from 'node:fs';

// Locally, credentials come from .env. In CI there's no .env file (it's
// gitignored) — the runner sets TRELLO_API_KEY/TRELLO_TOKEN directly instead.
const envPath = new URL('../.env', import.meta.url);
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
  throw new Error('Missing TRELLO_API_KEY or TRELLO_TOKEN (set via .env locally, or as env vars in CI)');
}

export function authHeader() {
  return `OAuth oauth_consumer_key="${TRELLO_API_KEY}", oauth_token="${TRELLO_TOKEN}"`;
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 */
export async function login(request) {
  const response = await request.get('members/me');

  if (!response.ok()) {
    throw new Error(`Trello login failed: ${response.status()} ${response.statusText()}`);
  }

  return response.json();
}
