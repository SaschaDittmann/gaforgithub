const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseCookies, stringifyCookies, uuidv4 } = require('./index.js');

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
