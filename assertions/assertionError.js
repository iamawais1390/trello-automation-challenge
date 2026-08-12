// @ts-check

export class AssertionError extends Error {
  /**
   * @param {string} description
   * @param {Error} cause
   */
  constructor(description, cause) {
    super(`Assertion failed: ${description}`, { cause });
    this.name = 'AssertionError';
  }
}
