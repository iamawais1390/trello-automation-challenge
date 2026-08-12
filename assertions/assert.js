// @ts-check
import { expect } from '@playwright/test';
import Logger from '../src/logger.js';
import { AssertionError } from './assertionError.js';

/**
 * @param {unknown} value
 * @returns {string}
 */
const describeValue = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return value.toString();
    case 'object':
      try {
        return JSON.stringify(value);
      } catch {
        return Object.prototype.toString.call(value);
      }
    default:
      return Object.prototype.toString.call(value);
  }
};

export const Assert = {
  /**
   * @param {import('@playwright/test').APIResponse} response
   * @param {string} description
   */
  assertIsOk: async (response, description) => {
    Logger.info(`Asserting response is OK: ${description}`);
    try {
      expect(response.ok(), description).toBeTruthy();
      Logger.info(`Assertion passed: ${description}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new AssertionError(description, error);
      }
      throw error;
    }
  },

  /**
   * @param {import('@playwright/test').APIResponse} response
   * @param {number} expectedStatus
   * @param {string} description
   */
  assertHasStatus: async (response, expectedStatus, description) => {
    Logger.info(`Asserting response status is ${expectedStatus}: ${description}`);
    try {
      expect(response.status(), description).toBe(expectedStatus);
      Logger.info(`Assertion passed: ${description}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new AssertionError(description, error);
      }
      throw error;
    }
  },

  /**
   * @param {unknown} value
   * @param {string} description
   */
  assertIsTruthy: async (value, description) => {
    Logger.info(`Asserting ${describeValue(value)} is truthy: ${description}`);
    try {
      expect(value, description).toBeTruthy();
      Logger.info(`Assertion passed: ${description}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new AssertionError(description, error);
      }
      throw error;
    }
  },

  /**
   * @param {unknown} actual
   * @param {unknown} expected
   * @param {string} description
   * @param {boolean} [softAssert]
   */
  assertAreEqual: async (actual, expected, description, softAssert = false) => {
    Logger.info(
      `Asserting ${describeValue(actual)} is equal to ${describeValue(expected)}: ${description}`
    );
    try {
      expect(actual, description).toBe(expected);
      Logger.info(`Assertion passed: ${description}`);
    } catch (error) {
      if (softAssert && error instanceof Error) {
        Logger.warn(`Soft assertion failed: ${description}. ${error.message}`);
        return;
      }
      if (error instanceof Error) {
        throw new AssertionError(description, error);
      }
      throw error;
    }
  },

  /**
   * @param {unknown} actual
   * @param {unknown} expected
   * @param {string} description
   */
  assertAreNotEqual: async (actual, expected, description) => {
    Logger.info(
      `Asserting ${describeValue(actual)} is not equal to ${describeValue(expected)}: ${description}`
    );
    try {
      expect(actual, description).not.toBe(expected);
      Logger.info(`Assertion passed: ${description}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new AssertionError(description, error);
      }
      throw error;
    }
  },

  /**
   * @param {unknown[]} array
   * @param {unknown} item
   * @param {string} description
   */
  assertContains: async (array, item, description) => {
    Logger.info(`Asserting array contains ${describeValue(item)}: ${description}`);
    try {
      expect(array, description).toContain(item);
      Logger.info(`Assertion passed: ${description}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new AssertionError(description, error);
      }
      throw error;
    }
  },

  /**
   * @param {import('@playwright/test').TestInfo} testInfo
   * @param {string} label
   * @param {number} durationMs
   * @param {number} [thresholdMs]
   */
  assertResponseTime: async (testInfo, label, durationMs, thresholdMs = 2000) => {
    Logger.info(`Asserting ${label} responded within ${thresholdMs}ms: took ${durationMs.toFixed(0)}ms`);
    testInfo.annotations.push({ type: 'response-time', description: `${label}: ${durationMs.toFixed(0)}ms` });
    try {
      expect(durationMs, `${label} response time`).toBeLessThan(thresholdMs);
      Logger.info(`Assertion passed: ${label} within SLA`);
    } catch (error) {
      if (error instanceof Error) {
        throw new AssertionError(`${label} response time`, error);
      }
      throw error;
    }
  },
};
