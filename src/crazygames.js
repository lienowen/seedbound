// Thin, defensive wrapper around the CrazyGames HTML5 SDK v3.
//
// The SDK script (loaded from CrazyGames' CDN in index.html) is only present
// when the game runs on crazygames.com. Everywhere else (local dev, itch,
// self-hosted, the v0 preview) `window.CrazyGames` is undefined. Every export
// here degrades to a silent no-op in that case so the game keeps working.

function sdk() {
  if (typeof window === "undefined") return null;
  return window.CrazyGames?.SDK || null;
}

let initPromise = null;
let ready = false;

/** Initialize the SDK once. Safe to call when the SDK is absent. */
export function initCrazyGames() {
  if (initPromise) return initPromise;
  const s = sdk();
  if (!s || typeof s.init !== "function") {
    initPromise = Promise.resolve(false);
    return initPromise;
  }
  initPromise = s
    .init()
    .then(() => {
      ready = true;
      return true;
    })
    .catch(() => false);
  return initPromise;
}

export function isCrazyGamesReady() {
  return ready;
}

function safeGame(method) {
  try {
    const s = sdk();
    if (ready && s?.game && typeof s.game[method] === "function") s.game[method]();
  } catch {
    /* no-op */
  }
}

export const cgLoadingStart = () => safeGame("loadingStart");
export const cgLoadingStop = () => safeGame("loadingStop");
export const cgGameplayStart = () => safeGame("gameplayStart");
export const cgGameplayStop = () => safeGame("gameplayStop");
/** Signal a moment of delight (level cleared, high score) for engagement tuning. */
export const cgHappytime = () => safeGame("happytime");

/**
 * Request a midgame ad. Resolves when the ad flow ends (finished, errored, or
 * skipped because the SDK is absent) so the caller can always continue.
 * The SDK automatically mutes/pauses the page during the ad.
 */
export function cgMidgameAd() {
  return new Promise((resolve) => {
    const s = sdk();
    if (!ready || !s?.ad || typeof s.ad.requestAd !== "function") {
      resolve("unavailable");
      return;
    }
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    try {
      s.ad.requestAd("midgame", {
        adStarted: () => {},
        adFinished: () => done("finished"),
        adError: () => done("error"),
      });
    } catch {
      done("error");
    }
    // Safety timeout so a stuck ad callback never blocks progression.
    setTimeout(() => done("timeout"), 20000);
  });
}

/**
 * Request a rewarded ad. `onReward` runs only when the ad actually finished.
 * Per CrazyGames policy, do NOT reward on adError.
 */
export function cgRewardedAd(onReward) {
  return new Promise((resolve) => {
    const s = sdk();
    if (!ready || !s?.ad || typeof s.ad.requestAd !== "function") {
      resolve("unavailable");
      return;
    }
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    try {
      s.ad.requestAd("rewarded", {
        adStarted: () => {},
        adFinished: () => {
          try {
            onReward?.();
          } finally {
            done("finished");
          }
        },
        adError: () => done("error"),
      });
    } catch {
      done("error");
    }
    setTimeout(() => done("timeout"), 30000);
  });
}
