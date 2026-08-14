// @ts-check

const Logger = {
  /** @param {string} message */
  info(message) {
    console.log(`[INFO] ${message}`);
  },
  /** @param {string} message */
  warn(message) {
    console.warn(`[WARN] ${message}`);
  },
  /** @param {string} message */
  error(message) {
    console.error(`[ERROR] ${message}`);
  },
};

export default Logger;
