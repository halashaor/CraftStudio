import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeWire, decodeWire } from '../src/runtime/engine-wire.js';
test('binary wire preserves sliced typed data, NBT-like reserved keys and special numeric values', () => {
  const backing = new Float32Array([9, 1.5, -0, NaN, Infinity, 8]),
    v = Object.fromEntries([
      ['__proto__', { safe: true }],
      ['$bytes', ['b', 'Float32Array', 'literal']],
    ]);
  v.mesh = backing.subarray(1, 5);
  v.bytes = new Uint8Array([1, 2, 3]).subarray(1);
  v.big = 9007199254740993n;
  v.longArray = new BigInt64Array([-1n, 9007199254740993n]);
  v.missing = undefined;
  v.nan = NaN;
  v.zero = -0;
  const out = decodeWire(encodeWire(v));
  assert.deepEqual(out, v);
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.ok(out.mesh instanceof Float32Array);
  assert.equal(Object.is(out.zero, -0), true);
  assert.equal(Object.prototype.safe, undefined);
});
test('v2 framing is lossless while legacy gzip envelopes remain readable', () => {
  const v = {
    positions: new Float32Array([1, 2, 3]),
    bytes: new Uint8Array([4, 5]),
    empty: new Uint16Array(0),
  };
  assert.deepEqual(decodeWire(encodeWire(v, { version: 1 })), v);
  const framed = encodeWire(v);
  assert.equal(String.fromCharCode(...framed.subarray(0, 7)), 'CSENGW2');
  assert.deepEqual(decodeWire(framed), v);
  assert.throws(() => decodeWire(framed.subarray(0, 10)));
  assert.throws(() => decodeWire(framed.subarray(0, framed.length - 1)));
  const extra = new Uint8Array(framed.length + 1);
  extra.set(framed);
  assert.throws(() => decodeWire(extra));
});
