import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUrl,
  parseStored,
  formatBookmark,
  generateSlug,
  uniqueSlug,
} from '../src/lib/bookmarks.ts';

test('URL with and without https:// normalises to the same value', () => {
  const a = normalizeUrl('www.example.com');
  const b = normalizeUrl('https://www.example.com');
  const c = normalizeUrl('  https://www.example.com/  ');
  assert.equal(a, 'https://www.example.com');
  assert.equal(a, b);
  assert.equal(b, c);
});

test('invalid or non-http URLs are rejected', () => {
  for (const v of ['', '   ', 'javascript:alert(1)', 'ftp://x.com', 'a b', null, 42]) {
    assert.equal(normalizeUrl(v), null);
  }
});

test('parseStored recovers from empty, corrupted, legacy and non-array values', () => {
  assert.deepEqual(parseStored(null), []);
  assert.deepEqual(parseStored(''), []);
  assert.deepEqual(parseStored('{not json'), []);
  assert.deepEqual(parseStored('{"url":"a.com","slug":"mona-1"}'), []);
  assert.deepEqual(parseStored('"text"'), []);
  assert.deepEqual(parseStored('42'), []);
  assert.deepEqual(parseStored('["https://a.com", 5, null]'), []);
  assert.deepEqual(parseStored('[{"url":"a.com"},{"slug":"mona-1"},{"url":1,"slug":2},null]'), []);
});

test('parseStored keeps valid entries and drops malformed ones', () => {
  const raw = JSON.stringify([
    { url: 'example.com', slug: 'mona-7fk2' },
    { url: 'javascript:alert(1)', slug: 'mona-bad1' },
    { nope: true },
  ]);
  assert.deepEqual(parseStored(raw), [{ url: 'https://example.com', slug: 'mona-7fk2' }]);
});

test('bookmark formats as "<url> :: <slug>"', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
    'https://www.example.com :: mona-7fk2',
  );
});

test('slugs are mona- plus 4 base62 chars and unique', () => {
  assert.match(generateSlug(), /^mona-[0-9a-zA-Z]{4}$/);
  assert.match(generateSlug(() => 0.9999999), /^mona-[0-9a-zA-Z]{4}$/);
  const first = generateSlug(() => 0);
  assert.notEqual(uniqueSlug([{ url: 'https://a.com', slug: first }], () => 0), first);
});
