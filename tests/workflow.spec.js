// @ts-check
import { test } from '../fixtures/test-data.js';
import { createBoard, getBoard, deleteBoard } from '../src/boards.js';
import { createList } from '../src/lists.js';
import { createCard, getCard, updateCard, deleteCard } from '../src/cards.js';
import { Assert } from '../assertions/index.js';

test('full Trello workflow: create board, list, card, update it, then clean up', async ({
  apiAuth,
  boardName,
  randomListName,
  randomCardName,
}) => {
  let boardId;

  try {
    const board = await (await createBoard(apiAuth, { name: boardName })).json();
    boardId = board.id;
    await Assert.assertIsTruthy(board.id, 'created board has an id');
    await Assert.assertAreEqual(board.name, boardName, 'created board has the expected name');

    const listName = randomListName();
    const list = await (await createList(apiAuth, { name: listName, idBoard: board.id })).json();
    await Assert.assertIsTruthy(list.id, 'created list has an id');
    await Assert.assertAreEqual(list.idBoard, board.id, 'created list belongs to the board');

    const cardName = randomCardName();
    const card = await (await createCard(apiAuth, { name: cardName, idList: list.id })).json();
    await Assert.assertIsTruthy(card.id, 'created card has an id');
    await Assert.assertAreEqual(card.idList, list.id, 'created card belongs to the list');

    const updatedCardName = randomCardName();
    const updateResponse = await updateCard(apiAuth, card.id, {
      name: updatedCardName,
      desc: 'Ready for review',
    });
    await Assert.assertIsOk(updateResponse, 'card update responds successfully');
    const updatedCard = await updateResponse.json();
    await Assert.assertAreEqual(updatedCard.name, updatedCardName, 'card name was updated');
    await Assert.assertAreEqual(updatedCard.desc, 'Ready for review', 'card description was updated');

    const deleteCardResponse = await deleteCard(apiAuth, card.id);
    await Assert.assertIsOk(deleteCardResponse, 'card deletion responds successfully');

    const deleteBoardResponse = await deleteBoard(apiAuth, board.id);
    await Assert.assertIsOk(deleteBoardResponse, 'board deletion responds successfully');
    boardId = undefined;

    await Assert.assertHasStatus(await getBoard(apiAuth, board.id), 404, 'deleted board is no longer retrievable');
    await Assert.assertHasStatus(await getCard(apiAuth, card.id), 404, 'deleted card is no longer retrievable');
  } finally {
    // Not a test assertion branch — a cleanup safety net so a failed
    // assertion above still deletes the board instead of orphaning it.
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (boardId) {
      await deleteBoard(apiAuth, boardId);
    }
  }
});
