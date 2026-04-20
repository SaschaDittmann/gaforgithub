const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { parseCookies, stringifyCookies, uuidv4, buildGA4Payload, GA4_ENDPOINT } = require('./index.js');

describe('parseCookies', () => {
  it('returns empty object for empty string', () => {
    const result = parseCookies('');
    assert.deepStrictEqual(result, {}, `Expected empty object but got ${JSON.stringify(result)}`);
  });

  it('parses a single cookie', () => {
    const result = parseCookies('GAGH=abc-123');
    assert.deepStrictEqual(result, { GAGH: 'abc-123' }, `Expected {GAGH: 'abc-123'} but got ${JSON.stringify(result)}`);
  });

  it('parses multiple cookies', () => {
    const result = parseCookies('GAGH=abc-123; other=value');
    assert.strictEqual(result.GAGH, 'abc-123', `Expected GAGH='abc-123' but got '${result.GAGH}'`);
    assert.strictEqual(result.other, 'value', `Expected other='value' but got '${result.other}'`);
  });

  it('handles URL-encoded values', () => {
    const result = parseCookies('key=hello%20world');
    assert.strictEqual(result.key, 'hello world', `Expected decoded 'hello world' but got '${result.key}'`);
  });

  it('returns empty object for null/undefined', () => {
    assert.deepStrictEqual(parseCookies(null), {}, 'Expected empty object for null input');
    assert.deepStrictEqual(parseCookies(undefined), {}, 'Expected empty object for undefined input');
  });

  it('handles malformed cookie gracefully', () => {
    const result = parseCookies(';;;');
    assert.ok(typeof result === 'object', `Expected object but got ${typeof result}`);
  });
});

describe('stringifyCookies', () => {
  it('returns empty string for empty object', () => {
    const result = stringifyCookies({});
    assert.strictEqual(result, '', `Expected empty string but got '${result}'`);
  });

  it('serializes a single cookie', () => {
    const result = stringifyCookies({ GAGH: 'abc-123' });
    assert.strictEqual(result, 'GAGH=abc-123', `Expected 'GAGH=abc-123' but got '${result}'`);
  });

  it('serializes multiple cookies separated by semicolons', () => {
    const result = stringifyCookies({ a: '1', b: '2' });
    assert.ok(result.includes('a=1'), `Expected result to contain 'a=1' but got '${result}'`);
    assert.ok(result.includes('b=2'), `Expected result to contain 'b=2' but got '${result}'`);
    assert.ok(result.includes('; '), `Expected semicolon separator but got '${result}'`);
  });

  it('URL-encodes cookie values', () => {
    const result = stringifyCookies({ key: 'hello world' });
    assert.strictEqual(result, 'key=hello%20world', `Expected URL-encoded value but got '${result}'`);
  });
});

describe('uuidv4', () => {
  it('generates a string matching UUID v4 format', () => {
    const uuid = uuidv4();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    assert.match(uuid, uuidRegex, `Expected UUID v4 format but got '${uuid}'`);
  });

  it('generates unique values across multiple calls', () => {
    const uuids = new Set(Array.from({ length: 100 }, () => uuidv4()));
    assert.strictEqual(uuids.size, 100, `Expected 100 unique UUIDs but got ${uuids.size} unique values`);
  });
});

describe('SVG response files', () => {
  const fs = require('fs');
  const path = require('path');

  it('gag-green.svg exists and contains valid SVG', () => {
    const svgPath = path.resolve(__dirname, 'gag-green.svg');
    assert.ok(fs.existsSync(svgPath), `Expected gag-green.svg to exist at ${svgPath}`);
    const content = fs.readFileSync(svgPath, 'utf-8');
    assert.ok(content.includes('<svg'), `Expected gag-green.svg to contain <svg tag but got: ${content.substring(0, 50)}`);
  });

  it('empty.svg exists and contains valid SVG', () => {
    const svgPath = path.resolve(__dirname, 'empty.svg');
    assert.ok(fs.existsSync(svgPath), `Expected empty.svg to exist at ${svgPath}`);
    const content = fs.readFileSync(svgPath, 'utf-8');
    assert.ok(content.includes('<svg'), `Expected empty.svg to contain <svg tag but got: ${content.substring(0, 50)}`);
  });
});

describe('GA4_ENDPOINT', () => {
  it('points to the GA4 Measurement Protocol collect endpoint', () => {
    assert.strictEqual(GA4_ENDPOINT, 'https://www.google-analytics.com/mp/collect',
      `Expected GA4 MP endpoint but got '${GA4_ENDPOINT}'`);
  });
});

describe('buildGA4Payload', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('constructs correct JSON structure with client_id and events array', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('my-repo', 'test-cid-123', 'TestAgent/1.0', '1.2.3.4', '');

    assert.strictEqual(payload.client_id, 'test-cid-123',
      `Expected client_id='test-cid-123' but got '${payload.client_id}'`);
    assert.ok(Array.isArray(payload.events),
      `Expected events to be an array but got ${typeof payload.events}`);
    assert.strictEqual(payload.events.length, 1,
      `Expected 1 event but got ${payload.events.length}`);
  });

  it('sets event name to page_view', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('my-repo', 'cid', 'Agent', '', '');

    assert.strictEqual(payload.events[0].name, 'page_view',
      `Expected event name 'page_view' but got '${payload.events[0].name}'`);
  });

  it('includes page_location with leading slash and repo name', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('awesome-project', 'cid', 'Agent', '', '');

    assert.strictEqual(payload.events[0].params.page_location, '/awesome-project',
      `Expected page_location='/awesome-project' but got '${payload.events[0].params.page_location}'`);
  });

  it('includes user_agent when provided', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('repo', 'cid', 'Mozilla/5.0', '', '');

    assert.strictEqual(payload.events[0].params.user_agent, 'Mozilla/5.0',
      `Expected user_agent='Mozilla/5.0' but got '${payload.events[0].params.user_agent}'`);
  });

  it('omits user_agent when empty', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('repo', 'cid', '', '', '');

    assert.strictEqual(payload.events[0].params.user_agent, undefined,
      `Expected user_agent to be undefined but got '${payload.events[0].params.user_agent}'`);
  });

  it('includes page_referrer when provided', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '', 'https://github.com');

    assert.strictEqual(payload.events[0].params.page_referrer, 'https://github.com',
      `Expected page_referrer='https://github.com' but got '${payload.events[0].params.page_referrer}'`);
  });

  it('omits page_referrer when empty', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '', '');

    assert.strictEqual(payload.events[0].params.page_referrer, undefined,
      `Expected page_referrer to be undefined but got '${payload.events[0].params.page_referrer}'`);
  });

  it('includes engagement_time_msec for proper session attribution', () => {
    process.env.ANONYMIZE_IP = '';
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '', '');

    assert.strictEqual(payload.events[0].params.engagement_time_msec, '1',
      `Expected engagement_time_msec='1' but got '${payload.events[0].params.engagement_time_msec}'`);
  });

  it('includes ip_override when IP is provided and ANONYMIZE_IP is not set', () => {
    delete process.env.ANONYMIZE_IP;
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '10.0.0.1', '');

    assert.strictEqual(payload.events[0].params.ip_override, '10.0.0.1',
      `Expected ip_override='10.0.0.1' but got '${payload.events[0].params.ip_override}'`);
  });

  it('includes ip_override when ANONYMIZE_IP is set to "0"', () => {
    process.env.ANONYMIZE_IP = '0';
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '10.0.0.1', '');

    assert.strictEqual(payload.events[0].params.ip_override, '10.0.0.1',
      `Expected ip_override when ANONYMIZE_IP='0' but got '${payload.events[0].params.ip_override}'`);
  });
});

describe('GA4 IP anonymization', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('excludes IP from payload when ANONYMIZE_IP=1', () => {
    process.env.ANONYMIZE_IP = '1';
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '192.168.1.1', '');

    assert.strictEqual(payload.events[0].params.ip_override, undefined,
      `Expected ip_override to be excluded when ANONYMIZE_IP=1 but got '${payload.events[0].params.ip_override}'`);
  });

  it('includes IP in payload when ANONYMIZE_IP is not set', () => {
    delete process.env.ANONYMIZE_IP;
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '192.168.1.1', '');

    assert.strictEqual(payload.events[0].params.ip_override, '192.168.1.1',
      `Expected ip_override='192.168.1.1' when ANONYMIZE_IP is unset but got '${payload.events[0].params.ip_override}'`);
  });

  it('omits ip_override when IP is empty regardless of ANONYMIZE_IP', () => {
    delete process.env.ANONYMIZE_IP;
    const payload = buildGA4Payload('repo', 'cid', 'Agent', '', '');

    assert.strictEqual(payload.events[0].params.ip_override, undefined,
      `Expected ip_override to be undefined for empty IP but got '${payload.events[0].params.ip_override}'`);
  });
});

describe('GA4 payload client_id format', () => {
  it('preserves UUID v4 client_id in the payload', () => {
    const cid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const payload = buildGA4Payload('repo', cid, 'Agent', '', '');

    assert.strictEqual(payload.client_id, cid,
      `Expected client_id to be preserved as '${cid}' but got '${payload.client_id}'`);
  });

  it('uses client_id as top-level field, not inside events', () => {
    const payload = buildGA4Payload('repo', 'test-cid', 'Agent', '', '');

    assert.strictEqual(typeof payload.client_id, 'string',
      `Expected client_id at top level but got type ${typeof payload.client_id}`);
    assert.strictEqual(payload.events[0].params.client_id, undefined,
      `client_id should not be inside event params`);
  });
});
