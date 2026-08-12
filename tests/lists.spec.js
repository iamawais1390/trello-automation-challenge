import { test } from '../fixtures/test-data.js';
import { createBoard, deleteBoard } from '../src/boards.js';
import { createList, getListsForBoard, getList, archiveList } from '../src/lists.js';
import { withTiming } from '../src/timing.js';
import { Assert } from '../assertions/index.js';

test.describe('List creation', () => {
  let boardId;

  test.beforeAll(async ({ apiAuth, boardName }) => {
    const response = await createBoard(apiAuth, { name: boardName });
    const board = await response.json();
    boardId = board.id;
  });

  test.afterAll(async ({ apiAuth }) => {
    await deleteBoard(apiAuth, boardId);
  });

  test('creates a list under a valid board', async ({ apiAuth, randomListName }, testInfo) => {
    const listName = randomListName();
    const { result: response, durationMs } = await withTiming(() =>
      createList(apiAuth, { name: listName, idBoard: boardId })
    );
    await Assert.assertIsOk(response, 'list creation responds successfully');

    const list = await response.json();
    await Assert.assertIsTruthy(list.id, 'created list has an id');
    await Assert.assertAreEqual(list.name, listName, 'created list has the expected name');
    await Assert.assertAreEqual(list.idBoard, boardId, 'created list belongs to the expected board');

    const boardLists = await getListsForBoard(apiAuth, boardId);
    const listIds = (await boardLists.json()).map((l) => l.id);
    await Assert.assertContains(listIds, list.id, 'new list appears under its board');

    await Assert.assertResponseTime(testInfo, 'POST /lists', durationMs);
  });

  test('rejects list creation with a missing name', async ({ apiAuth }) => {
    const response = await createList(apiAuth, { idBoard: boardId });
    await Assert.assertHasStatus(response, 400, 'list creation without a name is rejected');
  });

  test('rejects list creation with an invalid board id', async ({ apiAuth, randomListName }) => {
    const response = await createList(apiAuth, { name: randomListName(), idBoard: 'not-a-real-board-id' });
    await Assert.assertHasStatus(response, 400, 'list creation with an invalid board id is rejected');
  });
});

test.describe('List archiving', () => {
  let boardId;

  test.beforeAll(async ({ apiAuth, boardName }) => {
    const response = await createBoard(apiAuth, { name: boardName });
    boardId = (await response.json()).id;
  });

  test.afterAll(async ({ apiAuth }) => {
    await deleteBoard(apiAuth, boardId);
  });

  test('archives a list, since lists cannot be hard-deleted', async ({ apiAuth, randomListName }) => {
    const list = await (await createList(apiAuth, { name: randomListName(), idBoard: boardId })).json();

    const archiveResponse = await archiveList(apiAuth, list.id);
    await Assert.assertIsOk(archiveResponse, 'list archiving responds successfully');
    await Assert.assertAreEqual(
      (await archiveResponse.json()).closed,
      true,
      'archive response reports the list as closed'
    );

    const refetched = await (await getList(apiAuth, list.id)).json();
    await Assert.assertAreEqual(refetched.closed, true, 'archived list is closed when re-fetched');
  });
});
