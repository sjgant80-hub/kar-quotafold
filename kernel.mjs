// QuotaFold — largest-remainder apportionment.
// Pure, no I/O. Bad input returns {ok:false, why} instead of throwing.

function validateInputs(weights, seats) {
  if (!Array.isArray(weights) || weights.length === 0) {
    return { ok: false, why: 'weights must be a non-empty array' };
  }
  for (const w of weights) {
    if (typeof w !== 'number' || !Number.isFinite(w) || w < 0) {
      return { ok: false, why: 'weights must be non-negative finite numbers' };
    }
  }
  if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 0) {
    return { ok: false, why: 'seats must be a non-negative integer' };
  }
  return { ok: true };
}

// Largest-remainder (Hamilton) apportionment: floor each fair-share quota,
// then hand leftover units to the largest fractional remainders,
// tie-broken by ascending index.
export function largestRemainderApportion(weights, seats) {
  const validation = validateInputs(weights, seats);
  if (!validation.ok) return validation;

  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return { ok: false, why: 'total weight must be positive' };
  }

  const quotas = weights.map((w) => (w / total) * seats);
  const floors = quotas.map((q) => Math.floor(q));
  const remainders = quotas.map((q, i) => q - floors[i]);
  const baseSum = floors.reduce((a, b) => a + b, 0);
  const leftover = seats - baseSum;

  const order = weights
    .map((_, i) => i)
    .sort((a, b) => {
      if (remainders[b] !== remainders[a]) return remainders[b] - remainders[a];
      return a - b;
    });

  const allocation = floors.slice();
  for (let k = 0; k < leftover; k++) {
    allocation[order[k]] += 1;
  }

  return { ok: true, allocation, quotas, remainders };
}

// Exhaustively-checkable invariant: allocation entries are non-negative
// integers that sum exactly to seats.
export function invariantHolds(seats, allocation) {
  if (!Array.isArray(allocation)) return false;
  if (!allocation.every((a) => Number.isInteger(a) && a >= 0)) return false;
  return allocation.reduce((a, b) => a + b, 0) === seats;
}
