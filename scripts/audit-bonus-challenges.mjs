import {
  BONUS_CHALLENGES,
  bonusChallengeComplete,
  createBonusChallengeState,
  recordBonusPlacement,
} from "../src/runtime/bonusChallengeRules.js";

const plans = {
  "fridge-br-1": [["door", 80], ["door", 80], ["door", 80], ["door", 80]],
  "fridge-br-2": [["shelf", 70], ["shelf", 70]],
  "fridge-br-3": [["shelf", 80], ["door", 85], ["chill", 90]],
  "fridge-br-4": [["shelf", 70], ["door", 70], ["drawer", 70]],
  "fridge-br-5": [["door", 70], ["door", 70], ["door", 70]],
  "fridge-br-6": [["shelf", 70], ["door", 70], ["chill", 70], ["drawer", 70], ["shelf", 70]],
  "fridge-br-7": [["shelf", 75], ["shelf", 75], ["door", 75]],
  "fridge-br-8": [["shelf", 80], ["door", 80], ["chill", 80], ["drawer", 80]],
  "fridge-br-9": [["shelf", 70], ["door", 70], ["door", 70], ["chill", 70], ["drawer", 70]],
  "fridge-br-10": [["shelf", 70], ["door", 70], ["chill", 70], ["drawer", 70]],
};

let failed = false;
const ids = new Set();

for (const [levelId, spec] of Object.entries(BONUS_CHALLENGES)) {
  if (ids.has(spec.id)) {
    console.error(`FAIL duplicate challenge id ${spec.id}`);
    failed = true;
  }
  ids.add(spec.id);
  if (!(spec.bonus > 0)) {
    console.error(`FAIL invalid bonus ${levelId}`);
    failed = true;
  }

  const state = createBonusChallengeState(levelId);
  let now = 1000;
  for (const [zone, score] of plans[levelId] || []) {
    recordBonusPlacement(state, zone, score, now);
    now += 2500;
  }
  const ok = bonusChallengeComplete(state, now);
  console.log(`${ok ? "OK" : "FAIL"} ${levelId} challenge=${spec.id}`);
  if (!ok) failed = true;
}

const cleanMiss = createBonusChallengeState("fridge-br-1");
cleanMiss.misses = 1;
for (let i = 0; i < 4; i += 1) recordBonusPlacement(cleanMiss, "door", 80, 1000 + i * 500);
if (bonusChallengeComplete(cleanMiss, 4000)) {
  console.error("FAIL clean-start accepted a miss");
  failed = true;
}

const lateRush = createBonusChallengeState("fridge-br-9");
for (let i = 0; i < 5; i += 1) recordBonusPlacement(lateRush, "door", 80, 1000 + i * 8000);
if (bonusChallengeComplete(lateRush, 35000)) {
  console.error("FAIL quick-hands accepted an expired run");
  failed = true;
}

if (failed) process.exitCode = 1;
