const STORAGE_KEY = "seedbound.supermarket-v2.progress.v1";
const MAX_SHIFT = 3;

function clampShift(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.min(MAX_SHIFT, Math.trunc(numeric)));
}

function defaultProgress() {
  return { unlocked: 1, current: 1, completed: [] };
}

function writeProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing / blocked storage must never interrupt gameplay.
  }
  return progress;
}

export function readShiftProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      unlocked: clampShift(parsed?.unlocked || 1),
      current: clampShift(parsed?.current || 1),
      completed: Array.isArray(parsed?.completed)
        ? parsed.completed.map(clampShift).filter((value, index, list) => list.indexOf(value) === index)
        : [],
    };
  } catch {
    return defaultProgress();
  }
}

export function resolveInitialShift(search = window.location.search) {
  const params = new URLSearchParams(search);
  const explicit = params.get("shift");
  if (explicit != null && explicit !== "") return clampShift(explicit);
  return readShiftProgress().current;
}

export function saveShiftArrival(shiftNumber) {
  const shift = clampShift(shiftNumber);
  const current = readShiftProgress();
  return writeProgress({
    ...current,
    current: shift,
    unlocked: Math.max(current.unlocked, shift),
  });
}

export function saveShiftCompletion(shiftNumber) {
  const shift = clampShift(shiftNumber);
  const current = readShiftProgress();
  const nextShift = Math.min(MAX_SHIFT, shift + 1);
  const completed = current.completed.includes(shift)
    ? current.completed
    : [...current.completed, shift].sort((a, b) => a - b);
  return writeProgress({
    unlocked: Math.max(current.unlocked, nextShift),
    current: nextShift,
    completed,
  });
}

export function replaceShiftInUrl(shiftNumber) {
  try {
    const shift = clampShift(shiftNumber);
    const url = new URL(window.location.href);
    url.searchParams.set("shift", String(shift));
    window.history.replaceState({}, "", url);
  } catch {
    // URL synchronization is convenience only; gameplay state remains authoritative.
  }
}

export function maxShiftNumber() {
  return MAX_SHIFT;
}
