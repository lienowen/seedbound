const errors = [];
const store = new Map();

function fail(message) {
  errors.push(message);
}

function expect(condition, message) {
  if (!condition) fail(message);
}

globalThis.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
};

let replacedUrl = null;
globalThis.window = {
  location: {
    search: "",
    href: "https://example.test/game?v2=true",
  },
  history: {
    replaceState(_state, _title, url) {
      replacedUrl = String(url);
      window.location.href = replacedUrl;
      window.location.search = new URL(replacedUrl).search;
    },
  },
};

const {
  maxShiftNumber,
  readShiftProgress,
  replaceShiftInUrl,
  resolveInitialShift,
  saveShiftArrival,
  saveShiftCompletion,
} = await import("../src/supermarket-v2/model/shiftProgress.js");

expect(maxShiftNumber() === 3, `max-shift=${maxShiftNumber()}`);

{
  const initial = readShiftProgress();
  expect(initial.unlocked === 1, `initial-unlocked=${initial.unlocked}`);
  expect(initial.current === 1, `initial-current=${initial.current}`);
  expect(initial.completed.length === 0, `initial-completed=${initial.completed.join(",")}`);
  expect(resolveInitialShift("") === 1, `initial-resolve=${resolveInitialShift("")}`);
}

{
  const afterOne = saveShiftCompletion(1);
  expect(afterOne.unlocked === 2, `after-one-unlocked=${afterOne.unlocked}`);
  expect(afterOne.current === 2, `after-one-current=${afterOne.current}`);
  expect(afterOne.completed.join(",") === "1", `after-one-completed=${afterOne.completed.join(",")}`);
  expect(resolveInitialShift("") === 2, `resume-after-one=${resolveInitialShift("")}`);
  expect(window.location.search.includes("shift=2"), `after-one-url=${window.location.search}`);
}

{
  const arrived = saveShiftArrival(2);
  expect(arrived.current === 2, `arrival-current=${arrived.current}`);
  expect(arrived.unlocked === 2, `arrival-unlocked=${arrived.unlocked}`);

  const afterTwo = saveShiftCompletion(2);
  expect(afterTwo.unlocked === 3, `after-two-unlocked=${afterTwo.unlocked}`);
  expect(afterTwo.current === 3, `after-two-current=${afterTwo.current}`);
  expect(afterTwo.completed.join(",") === "1,2", `after-two-completed=${afterTwo.completed.join(",")}`);
  expect(window.location.search.includes("shift=3"), `after-two-url=${window.location.search}`);
}

{
  const afterThree = saveShiftCompletion(3);
  expect(afterThree.unlocked === 3, `after-three-unlocked=${afterThree.unlocked}`);
  expect(afterThree.current === 3, `after-three-current=${afterThree.current}`);
  expect(afterThree.completed.join(",") === "1,2,3", `after-three-completed=${afterThree.completed.join(",")}`);
  expect(resolveInitialShift("") === 3, `resume-after-three=${resolveInitialShift("")}`);
  expect(window.location.search.includes("shift=3"), `after-three-url=${window.location.search}`);
}

{
  expect(resolveInitialShift("?shift=1") === 1, `explicit-shift-one=${resolveInitialShift("?shift=1")}`);
  expect(resolveInitialShift("?shift=999") === 3, `explicit-shift-clamp=${resolveInitialShift("?shift=999")}`);
  expect(resolveInitialShift("?shift=bad") === 1, `explicit-shift-invalid=${resolveInitialShift("?shift=bad")}`);
}

{
  replaceShiftInUrl(2);
  expect(replacedUrl?.includes("shift=2"), `url-not-synced=${replacedUrl}`);
  expect(replacedUrl?.includes("v2=true"), `url-lost-v2=${replacedUrl}`);
}

// Blocked storage must not crash progression or the game loop.
{
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("storage-blocked");
  };
  let threw = false;
  try {
    saveShiftArrival(2);
    saveShiftCompletion(2);
  } catch {
    threw = true;
  }
  localStorage.setItem = originalSetItem;
  expect(!threw, "blocked-storage-threw");
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`));
  process.exitCode = 1;
} else {
  console.log("OK supermarket-v2-progression shifts=3 next=true resume=true completion-url=true url-sync=true storage-block-safe=true");
}
