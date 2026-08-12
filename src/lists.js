// @ts-check

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Record<string, string>} params
 */
export async function createList(request, params) {
  return request.post('lists', { params });
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} boardId
 */
export async function getListsForBoard(request, boardId) {
  return request.get(`boards/${boardId}/lists`);
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} listId
 */
export async function getList(request, listId) {
  return request.get(`lists/${listId}`);
}

/**
 * Lists cannot be hard-deleted via the Trello API, only archived.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} listId
 */
export async function archiveList(request, listId) {
  return request.put(`lists/${listId}/closed`, { params: { value: 'true' } });
}
