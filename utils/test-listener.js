// @ts-check
import Logger from './logger.js';

const TEST_SEPARATOR =
  '-----------------------------------------------------------------------------';

/** @typedef {import('@playwright/test/reporter').Reporter} Reporter */

/**
 * Buffers each test's console output and flushes it as one contiguous block
 * at onTestEnd, instead of letting parallel workers interleave test logs.
 * @implements {Reporter}
 */
export default class TestListener {
  /** @type {Map<string, string[]>} */
  #testLogs = new Map();

  /** @param {import('@playwright/test/reporter').TestCase} test */
  onTestBegin(test) {
    this.#testLogs.set(test.id, []);
    this.#logForTest(test.id, this.#formatMessage(`TEST: ${test.title} - STARTED`), true);
  }

  /**
   * @param {import('@playwright/test/reporter').TestCase} test
   * @param {import('@playwright/test/reporter').TestResult} result
   */
  onTestEnd(test, result) {
    const retryMessage = result.retry > 0 ? ` (Retry #${result.retry})` : '';
    const statusMessage = `TEST: ${test.title} - ${result.status.toUpperCase()}${retryMessage}`;
    const isFailure = result.status === 'failed' || result.status === 'timedOut';

    this.#logForTest(
      test.id,
      isFailure ? this.#formatError(statusMessage) : this.#formatMessage(statusMessage),
      true
    );

    if (isFailure && result.error) {
      this.#logForTest(test.id, this.#formatError(`Error: ${result.error.message}`));
      if (result.error.stack) {
        this.#logForTest(test.id, this.#formatError(`Stack trace:\n${result.error.stack}`));
      }
    }

    const logs = this.#testLogs.get(test.id) ?? [];
    console.log(logs.join('\n'));
    this.#testLogs.delete(test.id);
  }

  /**
   * @param {string | Buffer} chunk
   * @param {import('@playwright/test/reporter').TestCase} [test]
   */
  onStdOut(chunk, test) {
    if (test) {
      this.#logForTest(test.id, chunk.toString());
    } else {
      console.log(chunk.toString());
    }
  }

  /**
   * @param {string | Buffer} chunk
   * @param {import('@playwright/test/reporter').TestCase} [test]
   */
  onStdErr(chunk, test) {
    if (test) {
      this.#logForTest(test.id, chunk.toString());
    } else {
      console.error(chunk.toString());
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

  /** @param {string} separator */
  #formatSeparator(separator) {
    return `\x1b[33m${separator}\x1b[0m`;
  }

  /**
   * @param {string} testId
   * @param {string} message
   * @param {boolean} [withSeparator]
   */
  #logForTest(testId, message, withSeparator = false) {
    const logs = this.#testLogs.get(testId) ?? [];
    if (withSeparator) {
      logs.push(this.#formatSeparator(TEST_SEPARATOR));
    }
    logs.push(message);
    if (withSeparator) {
      logs.push(this.#formatSeparator(TEST_SEPARATOR));
    }
    this.#testLogs.set(testId, logs);
  }
}
