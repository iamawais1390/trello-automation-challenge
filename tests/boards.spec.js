// @ts-check
import { test } from '../fixtures/test-data.js';
import { createBoard, getBoard, deleteBoard } from '../src/boards.js';
import { createList, getList } from '../src/lists.js';
import { createCard, getCard } from '../src/cards.js';
import { withTiming } from '../src/timing.js';
import { Assert } from '../assertions/index.js';

test.describe('Board creation', () => {
  let boardId;

  test.afterEach(async ({ apiAuth }) => {
    if (boardId) {
      await deleteBoard(apiAuth, boardId);
      boardId = undefined;
    }
  });

  test('creates a board with a valid name', async ({ apiAuth, boardName }, testInfo) => {
    const { result: response, durationMs } = await withTiming(() =>
      createBoard(apiAuth, { name: boardName })
    );
    await Assert.assertIsOk(response, 'board creation responds successfully');

    const board = await response.json();
    boardId = board.id;

    await Assert.assertIsTruthy(board.id, 'created board has an id');
    await Assert.assertAreEqual(board.name, boardName, 'created board has the expected name');
    await Assert.assertAreEqual(board.closed, false, 'created board is not closed');

    await Assert.assertResponseTime(testInfo, 'POST /boards', durationMs);
  });
});

test.describe('Board validation', () => {
  test('rejects board creation with a missing name', async ({ apiAuth }) => {
    const response = await createBoard(apiAuth, {});
    await Assert.assertHasStatus(response, 400, 'board creation without a name is rejected');
  });

  test('rejects board creation with invalid auth', async ({ playwright }) => {
    const badAuthContext = await playwright.request.newContext({
      baseURL: 'https://api.trello.com/1/',
      extraHTTPHeaders: {
        Authorization: 'OAuth oauth_consumer_key="invalid", oauth_token="invalid"',
      },
    });

    const response = await createBoard(badAuthContext, { name: 'should-not-be-created' });
    await Assert.assertHasStatus(response, 401, 'board creation with invalid auth is rejected');

    await badAuthContext.dispose();
  });
});

test.describe('Board deletion', () => {
  test('deletes a board', async ({ apiAuth, boardName }) => {
    const board = await (await createBoard(apiAuth, { name: boardName })).json();

    const deleteResponse = await deleteBoard(apiAuth, board.id);
    await Assert.assertIsOk(deleteResponse, 'board deletion responds successfully');

    const getResponse = await getBoard(apiAuth, board.id);
    await Assert.assertHasStatus(getResponse, 404, 'deleted board is no longer retrievable');
  });

  test('cascades deletion to its lists and cards', async ({ apiAuth, boardName, randomListName, randomCardName }) => {
    const board = await (await createBoard(apiAuth, { name: boardName })).json();
    const list = await (await createList(apiAuth, { name: randomListName(), idBoard: board.id })).json();
    const card = await (await createCard(apiAuth, { name: randomCardName(), idList: list.id })).json();

    await deleteBoard(apiAuth, board.id);

    await Assert.assertHasStatus(
      await getList(apiAuth, list.id),
      404,
      'deleting a board also removes its lists'
    );
    await Assert.assertHasStatus(
      await getCard(apiAuth, card.id),
      404,
      'deleting a board also removes its cards'
    );
  });

  test('returns 404 when deleting an already-deleted board', async ({ apiAuth, boardName }) => {
    const board = await (await createBoard(apiAuth, { name: boardName })).json();

    await deleteBoard(apiAuth, board.id);
    const secondDelete = await deleteBoard(apiAuth, board.id);

    await Assert.assertHasStatus(secondDelete, 404, 'deleting an already-deleted board is rejected');
  });
});
