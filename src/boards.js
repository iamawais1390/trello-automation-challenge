// @ts-check

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Record<string, string>} params
 */
export async function createBoard(request, params) {
  return request.post('boards', { params });
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} boardId
 */
export async function getBoard(request, boardId) {
  return request.get(`boards/${boardId}`);
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} boardId
 */
export async function deleteBoard(request, boardId) {
  return request.delete(`boards/${boardId}`);
}
