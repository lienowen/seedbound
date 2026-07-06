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

function onCrazyGamesDomain() {
  if (typeof window === "undefined") return false;
  const hosts = [];
  try {
    hosts.push(window.location.hostname);
  } catch {
    /* no-op */
  }
  try {
    if (window.top && window.top !== window.self) hosts.push(window.top.location.hostname);
  } catch {
    try {
      if (document.referrer) hosts.push(new URL(document.referrer).hostname);
    } catch {
      /* no-op */
    }
  }
  return hosts.some((h) => /(^|\.)crazygames\.(com|games)$/i.test(h || ""));
}

let initPromise = null;
let ready = false;
const MIDGAME_COOLDOWN_MS = 90000;
let nextMidgameAdAt = Date.now() + MIDGAME_COOLDOWN_MS;

export function initCrazyGames() {
  if (initPromise) return initPromise;
  const s = sdk();
  if (!s || typeof s.init !== "function" || !onCrazyGamesDomain()) {
    initPromise = Promise.resolve(false);
    return initPromise;
  }
  initPromise = s
    .init()
    .then(() => {
      ready = true;
      nextMidgameAdAt = Date.now() + MIDGAME_COOLDOWN_MS;
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
export const cgHappytime = () => safeGame("happytime");

export function cgMidgameAd() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (now < nextMidgameAdAt) {
      resolve("cooldown");
      return;
    }

    const s = sdk();
    if (!ready || !s?.ad || typeof s.ad.requestAd !== "function") {
      resolve("unavailable");
      return;
    }

    nextMidgameAdAt = now + MIDGAME_COOLDOWN_MS;
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
    setTimeout(() => done("timeout"), 20000);
  });
}

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
