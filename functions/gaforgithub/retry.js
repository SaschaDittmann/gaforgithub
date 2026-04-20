// Retry utility using Node.js 20 native fetch API.
// Why native fetch? Node.js 20 includes a stable, spec-compliant fetch implementation
// (based on undici). Using it eliminates the need for third-party HTTP clients like axios,
// reducing dependency count, supply chain attack surface, and bundle size.
// The retry logic replaces the 'retry' npm package with a simple exponential backoff
// implementation that is easier to understand, test, and maintain.

/**
 * Sends an HTTP request with exponential backoff retry logic.
 * Retries on network errors and 5xx server responses.
 * Does NOT retry on client errors (4xx) or successful responses (2xx/3xx).
 *
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @param {object} [retryOptions] - Retry configuration.
 * @param {number} [retryOptions.maxAttempts=5] - Maximum number of retry attempts.
 * @param {number} [retryOptions.minTimeout=1000] - Minimum backoff delay in ms.
 * @param {number} [retryOptions.maxTimeout=60000] - Maximum backoff delay in ms.
 * @param {function} [retryOptions.onRetry] - Callback invoked before each retry with (error, attemptNumber).
 * @returns {Promise<Response>} The fetch Response object.
 * @throws {Error} After all retry attempts are exhausted.
 */
async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const {
    maxAttempts = 5,
    minTimeout = 1000,
    maxTimeout = 60000,
    onRetry = null,
  } = retryOptions;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Do not retry on success (2xx) or client errors (4xx)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx) — retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      lastError.status = response.status;
    } catch (error) {
      // Network error — retry
      lastError = error;
    }

    if (attempt < maxAttempts) {
      if (onRetry) {
        onRetry(lastError, attempt);
      }

      const delay = calculateBackoff(attempt, minTimeout, maxTimeout);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Calculates exponential backoff delay with jitter.
 * @param {number} attempt - Current attempt number (1-indexed).
 * @param {number} minTimeout - Minimum delay in ms.
 * @param {number} maxTimeout - Maximum delay in ms.
 * @returns {number} Delay in ms.
 */
function calculateBackoff(attempt, minTimeout, maxTimeout) {
  const exponentialDelay = minTimeout * Math.pow(2, attempt - 1);
  const jitter = Math.random() * exponentialDelay * 0.5;
  return Math.min(exponentialDelay + jitter, maxTimeout);
}

/**
 * Sleeps for the specified duration.
 * @param {number} ms - Duration in milliseconds.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { fetchWithRetry, calculateBackoff, sleep };
