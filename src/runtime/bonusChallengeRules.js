export const BONUS_CHALLENGES = {
  "fridge-br-1": { id: "clean-start", text: "Secret bonus: finish four placements without a miss", bonus: 18 },
  "fridge-br-2": { id: "shelf-first", text: "Secret bonus: start with two shelf placements", bonus: 14 },
  "fridge-br-3": { id: "happy-streak", text: "Secret bonus: make three happy placements in a row", bonus: 16 },
  "fridge-br-4": { id: "zone-tour", text: "Secret bonus: visit three different storage zones", bonus: 18 },
  "fridge-br-5": { id: "rack-rush", text: "Secret bonus: place three rack items in a row", bonus: 18 },
  "fridge-br-6": { id: "perfect-five", text: "Secret bonus: make five placements without a miss", bonus: 22 },
  "fridge-br-7": { id: "shelf-shelf-rack", text: "Secret bonus: shelf, shelf, then rack", bonus: 18 },
  "fridge-br-8": { id: "calm-streak", text: "Secret bonus: make four happy placements in a row", bonus: 24 },
  "fridge-br-9": { id: "quick-hands", text: "Secret bonus: land five items quickly with at most one miss", bonus: 22, seconds: 28 },
  "fridge-br-10": { id: "grand-tour", text: "Secret bonus: use four different storage zones", bonus: 28 },
};

export function createBonusChallengeState(levelId) {
  return {
    spec: BONUS_CHALLENGES[levelId] || null,
    startedAt: Date.now(),
    successCount: 0,
    misses: 0,
    happyStreak: 0,
    zones: new Set(),
    recentZones: [],
    shown: false,
    completed: false,
  };
}

export function recordBonusPlacement(state, zone, score) {
  state.successCount += 1;
  state.zones.add(zone || "unknown");
  state.recentZones.push(zone || "unknown");
  if (state.recentZones.length > 8) state.recentZones.shift();
  state.happyStreak = score >= 70 ? state.happyStreak + 1 : 0;
}

export function bonusChallengeComplete(state, now = Date.now()) {
  const spec = state.spec;
  if (!spec) return false;
  if (spec.id === "clean-start") return state.successCount >= 4 && state.misses === 0;
  if (spec.id === "shelf-first") return state.recentZones.length >= 2 && state.recentZones[0] === "shelf" && state.recentZones[1] === "shelf";
  if (spec.id === "happy-streak") return state.happyStreak >= 3;
  if (spec.id === "zone-tour") return state.zones.size >= 3;
  if (spec.id === "rack-rush") return state.recentZones.length >= 3 && state.recentZones.slice(-3).every((zone) => zone === "door");
  if (spec.id === "perfect-five") return state.successCount >= 5 && state.misses === 0;
  if (spec.id === "shelf-shelf-rack") {
    const last = state.recentZones.slice(-3);
    return last.length === 3 && last[0] === "shelf" && last[1] === "shelf" && last[2] === "door";
  }
  if (spec.id === "calm-streak") return state.happyStreak >= 4;
  if (spec.id === "quick-hands") return state.successCount >= 5 && state.misses <= 1 && now - state.startedAt <= spec.seconds * 1000;
  if (spec.id === "grand-tour") return state.zones.size >= 4;
  return false;
}
