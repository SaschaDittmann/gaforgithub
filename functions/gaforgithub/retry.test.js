const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { fetchWithRetry, calculateBackoff, sleep } = require('./retry.js');

describe('calculateBackoff', () => {
  it('returns at least minTimeout for first attempt', () => {
    const delay = calculateBackoff(1, 1000, 60000);
    assert.ok(delay >= 1000, `Expected delay >= 1000ms but got ${delay}ms`);
    assert.ok(delay <= 1500, `Expected delay <= 1500ms (base + jitter) but got ${delay}ms`);
  });

  it('increases delay exponentially for subsequent attempts', () => {
    const delay1 = calculateBackoff(1, 1000, 60000);
    const delay3 = calculateBackoff(3, 1000, 60000);
    // Attempt 3 base = 1000 * 2^2 = 4000; delay1 base = 1000
    assert.ok(delay3 > delay1, `Expected attempt 3 delay (${delay3}) > attempt 1 delay (${delay1})`);
  });

  it('caps delay at maxTimeout', () => {
    const delay = calculateBackoff(20, 1000, 5000);
    assert.ok(delay <= 5000, `Expected delay capped at 5000ms but got ${delay}ms`);
  });
});

describe('sleep', () => {
  it('resolves after the specified duration', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 45, `Expected at least 45ms elapsed but got ${elapsed}ms`);
  });
});

describe('fetchWithRetry', () => {
  it('returns response on successful fetch', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
    }));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const response = await fetchWithRetry('https://example.com', {});
      assert.strictEqual(response.status, 200, `Expected status 200 but got ${response.status}`);
      assert.strictEqual(mockFetch.mock.calls.length, 1, `Expected 1 fetch call but got ${mockFetch.mock.calls.length}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not retry on 400 client error', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    }));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const response = await fetchWithRetry('https://example.com', {}, { maxAttempts: 3, minTimeout: 10 });
      assert.strictEqual(response.status, 400, `Expected status 400 but got ${response.status}`);
      assert.strictEqual(mockFetch.mock.calls.length, 1, `Expected 1 fetch call (no retries) but got ${mockFetch.mock.calls.length}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('retries on 500 server error and eventually succeeds', async () => {
    let callCount = 0;
    const mockFetch = mock.fn(async () => {
      callCount++;
      if (callCount < 3) {
        return { ok: false, status: 500, statusText: 'Internal Server Error' };
      }
      return { ok: true, status: 200, statusText: 'OK' };
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const response = await fetchWithRetry('https://example.com', {}, { maxAttempts: 5, minTimeout: 10, maxTimeout: 50 });
      assert.strictEqual(response.status, 200, `Expected status 200 after retries but got ${response.status}`);
      assert.strictEqual(mockFetch.mock.calls.length, 3, `Expected 3 fetch calls (2 failures + 1 success) but got ${mockFetch.mock.calls.length}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('retries on network errors and eventually succeeds', async () => {
    let callCount = 0;
    const mockFetch = mock.fn(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Network error: connection refused');
      }
      return { ok: true, status: 200, statusText: 'OK' };
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const response = await fetchWithRetry('https://example.com', {}, { maxAttempts: 3, minTimeout: 10, maxTimeout: 50 });
      assert.strictEqual(response.status, 200, `Expected status 200 after network retry but got ${response.status}`);
      assert.strictEqual(mockFetch.mock.calls.length, 2, `Expected 2 fetch calls but got ${mockFetch.mock.calls.length}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws after exhausting all retry attempts on 500', async () => {
    const mockFetch = mock.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      await assert.rejects(
        () => fetchWithRetry('https://example.com', {}, { maxAttempts: 3, minTimeout: 10, maxTimeout: 50 }),
        (err) => {
          assert.ok(err.message.includes('500'), `Expected error message to include '500' but got '${err.message}'`);
          return true;
        }
      );
      assert.strictEqual(mockFetch.mock.calls.length, 3, `Expected 3 fetch calls (all failed) but got ${mockFetch.mock.calls.length}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws after exhausting all retry attempts on network error', async () => {
    const mockFetch = mock.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      await assert.rejects(
        () => fetchWithRetry('https://example.com', {}, { maxAttempts: 2, minTimeout: 10, maxTimeout: 50 }),
        (err) => {
          assert.ok(err.message.includes('ECONNREFUSED'), `Expected ECONNREFUSED error but got '${err.message}'`);
          return true;
        }
      );
      assert.strictEqual(mockFetch.mock.calls.length, 2, `Expected 2 fetch calls but got ${mockFetch.mock.calls.length}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('calls onRetry callback before each retry', async () => {
    let callCount = 0;
    const retryErrors = [];
    const mockFetch = mock.fn(async () => {
      callCount++;
      if (callCount < 3) {
        return { ok: false, status: 503, statusText: 'Service Unavailable' };
      }
      return { ok: true, status: 200, statusText: 'OK' };
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      await fetchWithRetry('https://example.com', {}, {
        maxAttempts: 5,
        minTimeout: 10,
        maxTimeout: 50,
        onRetry: (err, attempt) => retryErrors.push({ message: err.message, attempt }),
      });
      assert.strictEqual(retryErrors.length, 2, `Expected 2 onRetry calls but got ${retryErrors.length}`);
      assert.strictEqual(retryErrors[0].attempt, 1, `Expected first retry attempt=1 but got ${retryErrors[0].attempt}`);
      assert.strictEqual(retryErrors[1].attempt, 2, `Expected second retry attempt=2 but got ${retryErrors[1].attempt}`);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
