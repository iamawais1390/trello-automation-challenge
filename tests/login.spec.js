import { test } from '../fixtures/login.js';
import { Assert } from '../assertions/index.js';

test('authenticates against the Trello API', async ({ apiAuth }) => {
  const response = await apiAuth.get('members/me');

  await Assert.assertIsOk(response, 'authenticated request to /members/me responds successfully');

  const member = await response.json();
  await Assert.assertIsTruthy(member.username, 'authenticated member has a username');
});
