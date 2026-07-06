import { FRIDGE_BR_CAMPAIGN } from "../src/levels/fridgePhaserLevel.js";

const RULES = {
  "fridge-br-11": { wrongDelivery: true, waves: [{ after: 2, count: 2 }] },
  "fridge-br-12": { pickupAfter: 3 },
  "fridge-br-13": { waves: [{ after: 2, count: 2 }] },
  "fridge-br-14": { waves: [{ after: 2, count: 3 }] },
  "fridge-br-15": { wrongDelivery: true, pickupAfter: 3 },
  "fridge-br-16": { waves: [{ after: 2, count: 2 }] },
  "fridge-br-17": { pickupAfter: 2 },
  "fridge-br-18": { waves: [{ after: 2, count: 2 }], pickupAfter: 4 },
  "fridge-br-19": { pickupAfter: 3 },
  "fridge-br-20": { waves: [{ after: 2, count: 2 }], pickupAfter: 4 },
};

let failed = false;

for (const level of FRIDGE_BR_CAMPAIGN) {
  const rule = RULES[level.id];
  if (!rule) continue;

  const movable = level.items.filter((item) => !item.fixed).length;
  const waves = rule.waves || [];
  let visible = movable - waves.reduce((sum, wave) => sum + wave.count, 0);
  const errors = [];

  if (visible < 1) errors.push("no-initial-stock");
  for (const wave of waves) {
    if (!(wave.count > 0)) errors.push("invalid-wave-count");
    if (!(wave.after > 0)) errors.push("invalid-wave-threshold");
    if (visible < wave.after) errors.push(`wave-needs-${wave.after}-visible-${visible}`);
    visible += wave.count;
  }
  if (visible !== movable) errors.push(`wave-count-${visible}-of-${movable}`);

  if (rule.pickupAfter != null) {
    if (!(rule.pickupAfter > 0)) errors.push("invalid-pickup-threshold");
    if (rule.pickupAfter >= movable) errors.push(`pickup-${rule.pickupAfter}-of-${movable}`);
    if (movable < 2) errors.push("pickup-needs-two-items");
  }

  if (rule.wrongDelivery && movable < 1) errors.push("wrong-delivery-no-source");

  const ok = errors.length === 0;
  console.log(`${ok ? "OK" : "FAIL"} ${level.id} ${errors.join(" ") || "event-config"}`);
  if (!ok) failed = true;
}

if (failed) process.exitCode = 1;
