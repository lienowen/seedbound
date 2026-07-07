// Pure data shared by runtime event behavior and release audits.
// Keep this module free of Phaser/DOM imports so Node build gates can import it.
export const MID_CAMPAIGN_EVENTS = {
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

export function eventConfigFor(levelId) {
  return MID_CAMPAIGN_EVENTS[levelId] || null;
}
