process.loadEnvFile(new URL('../.env', import.meta.url));

const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
  throw new Error('Missing TRELLO_API_KEY or TRELLO_TOKEN in .env');
}

const BASE_URL = 'https://api.trello.com/1';

export function authHeader() {
  return `OAuth oauth_consumer_key="${TRELLO_API_KEY}", oauth_token="${TRELLO_TOKEN}"`;
}

export async function login() {
  const url = `${BASE_URL}/members/me?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Trello login failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
