import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, crc32Hex, createCrc32 } from '../src/index.js';

const ascii = (s) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

test('crc32 of empty input is the standard 0', () => {
  assert.equal(crc32(new Uint8Array(0)), 0);
  assert.equal(crc32Hex(new Uint8Array(0)), '00000000');
});

test('crc32 of the canonical "123456789" check value', () => {
  assert.equal(crc32(ascii('123456789')), 0xcbf43926);
  assert.equal(crc32Hex(ascii('123456789')), 'cbf43926');
});

test('crc32 accepts a plain number[] and an ArrayBuffer', () => {
  const expected = crc32(ascii('hello'));
  assert.equal(crc32([104, 101, 108, 108, 111]), expected);
  const buf = ascii('hello').buffer;
  assert.equal(crc32(buf), expected);
});

test('crc32 respects a typed-array view offset and length', () => {
  const backing = ascii('xxhello');
  const view = backing.subarray(2);
  assert.equal(crc32(view), crc32(ascii('hello')));
});

test('crc32 rejects out-of-range byte values in a number[]', () => {
  assert.throws(() => crc32([256]), TypeError);
  assert.throws(() => crc32([-1]), TypeError);
  assert.throws(() => crc32([1.5]), TypeError);
});

test('crc32 rejects unsupported input types', () => {
  assert.throws(() => crc32('hello'), TypeError);
  assert.throws(() => crc32(null), TypeError);
  assert.throws(() => crc32(undefined), TypeError);
});

test('incremental updates match the one-shot result', () => {
  const bytes = ascii('The quick brown fox jumps over the lazy dog');
  const oneShot = crc32(bytes);
  const inc = createCrc32();
  inc.update(bytes.subarray(0, 10));
  inc.update(bytes.subarray(10, 20));
  inc.update(bytes.subarray(20));
  assert.equal(inc.digest(), oneShot);
  assert.equal(inc.digestHex(), crc32Hex(bytes));
});

test('incremental digest is stable across repeated calls', () => {
  const inc = createCrc32();
  inc.update(ascii('abc'));
  const first = inc.digest();
  const second = inc.digest();
  assert.equal(first, second);
});

test('reset restores the initial state', () => {
  const inc = createCrc32();
  inc.update(ascii('garbage'));
  inc.reset();
  inc.update(ascii('123456789'));
  assert.equal(inc.digest(), 0xcbf43926);
});

test('update returns the instance for chaining', () => {
  const inc = createCrc32();
  const chained = inc.update(ascii('a')).update(ascii('b'));
  assert.equal(chained, inc);
  assert.equal(inc.digest(), crc32(ascii('ab')));
});

test('hex output is always exactly eight lowercase characters', () => {
  for (const s of ['', 'a', 'abcdefghijklmnopqrstuvwxyz', '\u0000\u00ff']) {
    const hex = crc32Hex(ascii(s));
    assert.equal(hex.length, 8);
    assert.match(hex, /^[0-9a-f]{8}$/);
  }
});

test('crc32 is deterministic across repeated calls', () => {
  const bytes = ascii('determinism');
  assert.equal(crc32(bytes), crc32(bytes));
});
