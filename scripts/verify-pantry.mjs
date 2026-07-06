// Verifies every pantry level is solvable under the new category/weight/neighbor
// rules by applying a hand-authored solution and asserting validate().complete.
globalThis.localStorage = {
  _m: new Map(),
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
  setItem(k, v) { this._m.set(k, v); },
  removeItem(k) { this._m.delete(k); },
};

const { FRIDGE_BR_CAMPAIGN } = await import("../src/levels/fridgePhaserLevel.js");
const { StorageEngine } = await import("../src/game/StorageEngine.js");

// solution: array of [imageKey, slotId, col]
const SOLUTIONS = {
  "pantry-1": [["jam", "pantry_top", 0], ["honey", "pantry_top", 1], ["coffee", "pantry_up", 0], ["beans", "pantry_up", 1]],
  "pantry-2": [["jam", "pantry_top", 0], ["honey", "pantry_top", 1], ["coffee", "pantry_up", 0], ["beans", "pantry_up", 1], ["chips", "pantry_low", 0]],
  "pantry-3": [["cookies", "pantry_top", 0], ["jam", "pantry_up", 0], ["honey", "pantry_up", 1], ["coffee", "pantry_low", 0], ["beans", "pantry_low", 1], ["pasta", "pantry_base", 0]],
  "pantry-4": [["crackers", "pantry_low", 0], ["pasta", "pantry_base", 0], ["chips", "pantry_top", 0], ["jam", "pantry_top", 1], ["honey", "pantry_up", 0]],
  "pantry-5": [["crackers", "pantry_low", 0], ["pasta", "pantry_base", 0], ["chips", "pantry_top", 0], ["honey", "pantry_top", 1], ["jam", "pantry_up", 0], ["peanut", "pantry_up", 1]],
  "pantry-6": [["jam", "pantry_top", 0], ["honey", "pantry_top", 1], ["peanut", "pantry_up", 0], ["coffee", "pantry_low", 0], ["beans", "pantry_low", 1]],
  "pantry-7": [["jam", "pantry_top", 0], ["honey", "pantry_top", 1], ["coffee", "pantry_up", 0], ["beans", "pantry_up", 1], ["chips", "pantry_low", 0]],
  "pantry-8": [["crackers", "pantry_low", 0], ["pasta", "pantry_base", 0], ["jam", "pantry_top", 0], ["honey", "pantry_top", 1], ["chips", "pantry_up", 0], ["peanut", "pantry_up", 1]],
  "pantry-9": [["jam", "pantry_top", 0], ["honey", "pantry_top", 1], ["coffee", "pantry_up", 0], ["beans", "pantry_up", 1], ["crackers", "pantry_low", 0], ["pasta", "pantry_base", 0]],
};

const levels = FRIDGE_BR_CAMPAIGN.filter((l) => l.id && l.id.startsWith("pantry-"));
let allPass = true;
for (const level of levels) {
  const sol = SOLUTIONS[level.id];
  if (!sol) { console.log(`SKIP ${level.id} (no solution defined)`); continue; }
  const engine = new StorageEngine(level, { forceFresh: true, saveId: `verify-${level.id}` });
  const byImage = new Map();
  for (const it of level.items) if (!it.fixed) byImage.set(it.image, it.id);
  let ok = true;
  const failures = [];
  for (const [img, slotId, col] of sol) {
    const id = byImage.get(img);
    if (!id) { failures.push(`no item ${img}`); ok = false; continue; }
    const res = engine.placeItem(id, { slotId, col, row: 0, layer: 0 });
    if (!res.ok) { failures.push(`${img}->${slotId}:${col} rejected (${res.reason})`); ok = false; }
  }
  const v = engine.validate();
  const complete = v.complete;
  const status = complete ? "PASS" : "FAIL";
  if (!complete) allPass = false;
  console.log(`${status} ${level.id} — settled ${v.settledCount}/${v.constrainedTotal}, complete=${complete}${failures.length ? " :: " + failures.join("; ") : ""}`);
}
console.log(allPass ? "\nALL PANTRY LEVELS SOLVABLE" : "\nSOME LEVELS FAILED");
process.exit(allPass ? 0 : 1);
