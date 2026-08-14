// @ts-check
import Logger from './logger.js';

const TEST_SEPARATOR =
  '-----------------------------------------------------------------------------';

/** @typedef {import('@playwright/test/reporter').Reporter} Reporter */

/**
 * Prints a colored START/PASSED/FAILED separator block around each test,
 * so test boundaries are visually clear even under parallel workers.
 *
 * Deliberately does not buffer/replay stdout: Playwright's onStdOut/onStdErr
 * hooks hand reporters a *copy* of process output for use in report
 * artifacts, they don't suppress the live terminal print - re-printing that
 * copy here would just duplicate output that already appeared once, live,
 * as the test ran.
 * @implements {Reporter}
 */
export default class TestListener {
  /** @param {import('@playwright/test/reporter').TestCase} test */
  onTestBegin(test) {
    this.#printBlock(this.#formatMessage(`TEST: ${test.title} - STARTED`));
  }

  /**
   * @param {import('@playwright/test/reporter').TestCase} test
   * @param {import('@playwright/test/reporter').TestResult} result
   */
  onTestEnd(test, result) {
    const retryMessage = result.retry > 0 ? ` (Retry #${result.retry})` : '';
    const statusMessage = `TEST: ${test.title} - ${result.status.toUpperCase()}${retryMessage}`;
    const isFailure = result.status === 'failed' || result.status === 'timedOut';

    this.#printBlock(isFailure ? this.#formatError(statusMessage) : this.#formatMessage(statusMessage));

    if (isFailure && result.error) {
      console.log(this.#formatError(`Error: ${result.error.message}`));
      if (result.error.stack) {
        console.log(this.#formatError(`Stack trace:\n${result.error.stack}`));
      }
    }
  }

  /** @param {import('@playwright/test/reporter').TestError} error */
  onError(error) {
    Logger.error(`Message: ${error.message}`);
    if (error.stack) {
      Logger.error(`Stack: ${error.stack}`);
    }
  }

  /** @param {import('@playwright/test/reporter').FullResult} result */
  async onEnd(result) {
    if (result.status === 'passed') {
      Logger.info('\n✓ Build passed!\n');
    } else if (result.status === 'failed') {
      Logger.error('\n✗ Build failed!\n');
    }
  }

  /** @param {string} msg */
  #formatMessage(msg) {
    return `\x1b[34m${msg}\x1b[0m`;
  }

  /** @param {string} msg */
  #formatError(msg) {
    return `\x1b[31m${msg}\x1b[0m`;
  }

  /** @param {string} message */
  #printBlock(message) {
    const separator = `\x1b[33m${TEST_SEPARATOR}\x1b[0m`;
    console.log(`${separator}\n${message}\n${separator}`);
  }
}
