import { test } from '../fixtures/test-data.js';
import { createBoard, deleteBoard } from '../src/boards.js';
import { createList } from '../src/lists.js';
import { createCard, getCardsForList, getCard, updateCard, deleteCard } from '../src/cards.js';
import { withTiming } from '../src/timing.js';
import { Assert } from '../assertions/index.js';

const NONEXISTENT_CARD_ID = '000000000000000000000000';

test.describe('Card creation', () => {
  let boardId;
  let listId;

  test.beforeAll(async ({ apiAuth, boardName, randomListName }) => {
    const boardResponse = await createBoard(apiAuth, { name: boardName });
    boardId = (await boardResponse.json()).id;

    const listResponse = await createList(apiAuth, { name: randomListName(), idBoard: boardId });
    listId = (await listResponse.json()).id;
  });

  test.afterAll(async ({ apiAuth }) => {
    await deleteBoard(apiAuth, boardId);
  });

  test('creates a card under a valid list', async ({ apiAuth, randomCardName }, testInfo) => {
    const cardName = randomCardName();
    const { result: response, durationMs } = await withTiming(() =>
      createCard(apiAuth, { name: cardName, idList: listId })
    );
    await Assert.assertIsOk(response, 'card creation responds successfully');

    const card = await response.json();
    await Assert.assertIsTruthy(card.id, 'created card has an id');
    await Assert.assertAreEqual(card.name, cardName, 'created card has the expected name');
    await Assert.assertAreEqual(card.idList, listId, 'created card belongs to the expected list');

    const listCards = await getCardsForList(apiAuth, listId);
    const cardIds = (await listCards.json()).map((c) => c.id);
    await Assert.assertContains(cardIds, card.id, 'new card appears under its list');

    await Assert.assertResponseTime(testInfo, 'POST /cards', durationMs);
  });

  test('creates a card without a name, since name is optional', async ({ apiAuth }) => {
    const response = await createCard(apiAuth, { idList: listId });
    await Assert.assertIsOk(response, 'card creation without a name responds successfully');

    const card = await response.json();
    await Assert.assertAreEqual(card.name, '', 'card created without a name defaults to an empty name');
  });

  test('rejects card creation with a missing idList', async ({ apiAuth, randomCardName }) => {
    const response = await createCard(apiAuth, { name: randomCardName() });
    await Assert.assertHasStatus(response, 400, 'card creation without an idList is rejected');
  });

  test('rejects card creation with an invalid idList', async ({ apiAuth, randomCardName }) => {
    const response = await createCard(apiAuth, { name: randomCardName(), idList: 'not-a-real-list-id' });
    await Assert.assertHasStatus(response, 400, 'card creation with an invalid idList is rejected');
  });
});

test.describe('Card update', () => {
  let boardId;
  let listId;
  let secondListId;
  let cardId;
  let originalCardName;

  test.beforeAll(async ({ apiAuth, boardName, randomListName }) => {
    const boardResponse = await createBoard(apiAuth, { name: boardName });
    boardId = (await boardResponse.json()).id;

    const listResponse = await createList(apiAuth, { name: randomListName(), idBoard: boardId });
    listId = (await listResponse.json()).id;

    const secondListResponse = await createList(apiAuth, { name: randomListName(), idBoard: boardId });
    secondListId = (await secondListResponse.json()).id;
  });

  test.afterAll(async ({ apiAuth }) => {
    await deleteBoard(apiAuth, boardId);
  });

  test.beforeEach(async ({ apiAuth, randomCardName }) => {
    originalCardName = randomCardName();
    const response = await createCard(apiAuth, {
      name: originalCardName,
      desc: 'Original description',
      idList: listId,
    });
    cardId = (await response.json()).id;
  });

  test('renames a card and updates its description', async ({ apiAuth, randomCardName }, testInfo) => {
    const newCardName = randomCardName();
    const { result: response, durationMs } = await withTiming(() =>
      updateCard(apiAuth, cardId, { name: newCardName, desc: 'Updated description' })
    );
    await Assert.assertIsOk(response, 'card update responds successfully');

    const updated = await response.json();
    await Assert.assertAreEqual(updated.name, newCardName, 'update response reflects the new name');
    await Assert.assertAreEqual(updated.desc, 'Updated description', 'update response reflects the new description');

    const refetched = await (await getCard(apiAuth, cardId)).json();
    await Assert.assertAreEqual(refetched.name, newCardName, 'updated name persists when re-fetched');
    await Assert.assertAreEqual(refetched.desc, 'Updated description', 'updated description persists when re-fetched');

    await Assert.assertResponseTime(testInfo, 'PUT /cards/{id}', durationMs);
  });

  test('moves a card to another list', async ({ apiAuth }) => {
    const response = await updateCard(apiAuth, cardId, { idList: secondListId });
    await Assert.assertIsOk(response, 'card move responds successfully');

    const updated = await response.json();
    await Assert.assertAreEqual(updated.idList, secondListId, 'card now belongs to the target list');
  });

  test('returns 404 when updating a non-existent card', async ({ apiAuth }) => {
    const response = await updateCard(apiAuth, NONEXISTENT_CARD_ID, { name: 'x' });
    await Assert.assertHasStatus(response, 404, 'updating a non-existent card is rejected');
  });

  test('partial update does not clobber other fields', async ({ apiAuth }) => {
    const response = await updateCard(apiAuth, cardId, { desc: 'Only description changed' });
    await Assert.assertIsOk(response, 'partial card update responds successfully');

    const updated = await response.json();
    await Assert.assertAreEqual(updated.desc, 'Only description changed', 'targeted field was updated');
    await Assert.assertAreEqual(updated.name, originalCardName, 'untouched field was left unchanged');
  });
});

test.describe('Card deletion', () => {
  let boardId;
  let listId;

  test.beforeAll(async ({ apiAuth, boardName, randomListName }) => {
    const boardResponse = await createBoard(apiAuth, { name: boardName });
    boardId = (await boardResponse.json()).id;

    const listResponse = await createList(apiAuth, { name: randomListName(), idBoard: boardId });
    listId = (await listResponse.json()).id;
  });

  test.afterAll(async ({ apiAuth }) => {
    await deleteBoard(apiAuth, boardId);
  });

  test('deletes a card', async ({ apiAuth, randomCardName }) => {
    const created = await (await createCard(apiAuth, { name: randomCardName(), idList: listId })).json();

    const deleteResponse = await deleteCard(apiAuth, created.id);
    await Assert.assertIsOk(deleteResponse, 'card deletion responds successfully');

    const getResponse = await getCard(apiAuth, created.id);
    await Assert.assertHasStatus(getResponse, 404, 'deleted card is no longer retrievable');
  });
});
