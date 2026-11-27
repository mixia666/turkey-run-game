// Seeded randomness (mulberry32) so a screenshot seed always stages the same run.
// One clear job: deterministic numbers, nothing else.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `items` with weights, using `rand`. */
export function weightedPick(rand, items) {
  let total = 0;
  for (const item of items) total += item.weight;
  let roll = rand() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

/** Integer in [min, max] from `rand`. */
export function randInt(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

/** Float in [min, max) from `rand`. */
export function randFloat(rand, min, max) {
  return min + rand() * (max - min);
}
