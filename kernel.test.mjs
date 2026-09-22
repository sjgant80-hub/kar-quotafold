import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from './kernel.mjs';

test('classic four-party example matches known largest-remainder result', () => {
  const result = K.largestRemainderApportion([41, 29, 17, 13], 10);
  assert.equal(result.ok, true);
  assert.deepEqual(result.allocation, [4, 3, 2, 1]);
});

test('tied remainders break by ascending index', () => {
  const result = K.largestRemainderApportion([1, 1], 1);
  assert.equal(result.ok, true);
  assert.deepEqual(result.allocation, [1, 0]);
});

test('three-way tie on remainder breaks to lowest index', () => {
  const result = K.largestRemainderApportion([10, 10, 10], 7);
  assert.equal(result.ok, true);
  assert.deepEqual(result.allocation, [3, 2, 2]);
});

test('zero seats allocates nothing to anyone', () => {
  const result = K.largestRemainderApportion([5, 3, 2], 0);
  assert.equal(result.ok, true);
  assert.deepEqual(result.allocation, [0, 0, 0]);
});

test('negative weight and non-integer seats are refused, not thrown', () => {
  assert.equal(K.largestRemainderApportion([5, -1, 2], 10).ok, false);
  assert.equal(K.largestRemainderApportion([5, 1, 2], 3.5).ok, false);
});

test('invariantHolds confirms allocation sums exactly to seats', () => {
  const result = K.largestRemainderApportion([41, 29, 17, 13], 10);
  assert.equal(K.invariantHolds(10, result.allocation), true);
  assert.equal(K.invariantHolds(11, result.allocation), false);
});

// --- boundary / clause-isolating probes added to kill surviving mutants ---

test('non-array weights refused (isolates first clause of the array-or-empty guard)', () => {
  // Array.isArray(...) is false here but .length is non-zero, so under the
  // real `||` this is rejected IMMEDIATELY by the isArray clause. A mutant
  // that flips this guard to `&&` would fall through instead and only get
  // caught later by the per-element number check, with a DIFFERENT `why` —
  // so pin the exact why, not just ok:false, to isolate this clause.
  const result = K.largestRemainderApportion('not an array', 5);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'weights must be a non-empty array');
});

test('empty weights array refused (isolates second clause of the array-or-empty guard)', () => {
  // Array.isArray(...) is true here, so this can only be caught by the
  // length===0 clause under the real `||`. A mutant that flips this guard to
  // `&&` would fall through validateInputs entirely (empty array satisfies
  // every per-element check vacuously) and only fail later on `total <= 0`,
  // with a DIFFERENT `why` — pin the exact why to isolate this clause.
  const result = K.largestRemainderApportion([], 5);
  assert.equal(result.ok, false);
  assert.equal(result.why, 'weights must be a non-empty array');
});

test('NaN weight refused (typeof is "number" but not finite, isolating the finiteness clause)', () => {
  const result = K.largestRemainderApportion([1, NaN, 2], 5);
  assert.equal(result.ok, false);
});

test('zero weight is a valid non-negative weight, not refused (w < 0 boundary, not <=)', () => {
  const result = K.largestRemainderApportion([0, 5], 3);
  assert.equal(result.ok, true);
  assert.deepEqual(result.allocation, [0, 3]);
});

test('all-zero weights refused: total of exactly zero is not positive (total <= 0 boundary)', () => {
  const result = K.largestRemainderApportion([0, 0, 0], 5);
  assert.equal(result.ok, false);
});

test('invariantHolds rejects a non-array allocation instead of vacuously passing', () => {
  assert.equal(K.invariantHolds(5, 'not-array'), false);
});

test('invariantHolds rejects non-integer entries even when their sum matches seats', () => {
  assert.equal(K.invariantHolds(5, [2.5, 2.5]), false);
});

test('invariantHolds accepts a zero entry (a >= 0 boundary, not a > 0)', () => {
  assert.equal(K.invariantHolds(5, [5, 0, 0]), true);
});

test('invariantHolds rejects a negative integer entry even when the sum matches seats (isolates && from ||)', () => {
  assert.equal(K.invariantHolds(4, [-1, 5]), false);
});
