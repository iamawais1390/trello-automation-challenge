// @ts-check

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Record<string, string>} params
 */
export async function createCard(request, params) {
  return request.post('cards', { params });
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} listId
 */
export async function getCardsForList(request, listId) {
  return request.get(`lists/${listId}/cards`);
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} cardId
 */
export async function getCard(request, cardId) {
  return request.get(`cards/${cardId}`);
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} cardId
 * @param {Record<string, string>} params
 */
export async function updateCard(request, cardId, params) {
  return request.put(`cards/${cardId}`, { params });
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} cardId
 */
export async function deleteCard(request, cardId) {
  return request.delete(`cards/${cardId}`);
}
