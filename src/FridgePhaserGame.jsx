import { useEffect, useMemo, useRef, useState } from "react";
import Phaser from "phaser";
import { StorageScene } from "./game/StorageScene.js";
import { createUiSounds } from "./game/playFeedback.js";
import { FRIDGE_BR_CAMPAIGN, MAKEUP_LEVEL } from "./levels/fridgePhaserLevel.js";
import { createI18n, localizeCampaign, localizeLevel } from "./i18n/index.js";
import { effectiveLocale, htmlLang, isLocaleSwitcherEnabled, parseLocale, progressStorageKey, switchLocaleHref, writeLocalePreference } from "./i18n/locale.js";
import { MetaLayer } from "./components/MetaLayer.jsx";
import { readMeta, writeMeta, discoverItem, bumpStreak, skinById } from "./meta/metaProgress.js";
import "./meta.css";

const HINT_COST = 25;
const LOW_COINS_HINT = HINT_COST - 1;

function readProgress(locale) {
  const key = progressStorageKey(locale);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { unlocked: 1, coins: 125, current: 0 };
    const parsed = JSON.parse(raw);
    const unlocked = Math.max(1, Math.min(FRIDGE_BR_CAMPAIGN.length, parsed.unlocked || 1));
    const current = Math.max(0, Math.min(unlocked - 1, parsed.current || 0));
    return {
      unlocked,
      coins: Math.max(0, parsed.coins || 0),
      current,
    };
  } catch {
    return { unlocked: 1, coins: 125, current: 0 };
  }
}

function writeProgress(locale, progress) {
  try {
    localStorage.setItem(progressStorageKey(locale), JSON.stringify(progress));
  } catch {
    // Progress save should never block gameplay.
  }
}

export function FridgePhaserGame() {
  const mount = useRef(null);
  const sceneRef = useRef(null);
  const soundRef = useRef(null);
  const gameRef = useRef(null);
  const pendingFreshRef = useRef(false);
  const localeSwitcherEnabled = isLocaleSwitcherEnabled();
  const [locale, setLocale] = useState(() => effectiveLocale(parseLocale(window.location)));
  const i18n = useMemo(() => createI18n(locale), [locale]);
  const campaign = useMemo(() => localizeCampaign(FRIDGE_BR_CAMPAIGN, locale), [locale]);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const editMode = params.get("edit") === "true";
  const theme = params.get("theme") === "makeup" ? "makeup" : "fridge";
  const [progress, setProgress] = useState(() => (theme === "makeup" ? { unlocked: 1, coins: 0, current: 0 } : readProgress(locale)));
  const [hud, setHud] = useState({ placed: 0, total: 4 });
  const [message, setMessage] = useState(i18n.ui.dragHint);
  const [complete, setComplete] = useState(false);
  const [editorJson, setEditorJson] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [copyState, setCopyState] = useState(i18n.ui.copyJson);
  const [reloadToken, setReloadToken] = useState(0);
  const [booting, setBooting] = useState(true);
  const [bootVariant, setBootVariant] = useState("initial");
  const [lastReward, setLastReward] = useState(0);
  const [lastStars, setLastStars] = useState(0);
  const [meta, setMeta] = useState(() => readMeta());
  const [discovery, setDiscovery] = useState(null);
  const [autoOpenDaily, setAutoOpenDaily] = useState(true);
  const metaRef = useRef(meta);
  metaRef.current = meta;
  const discoveryTimerRef = useRef(null);
  const placedRef = useRef(0);
  const currentIndexRef = useRef(0);
  const progressRef = useRef(progress);
  const hasMountedOnceRef = useRef(false);

  const currentIndex = theme === "makeup" ? 0 : Math.min(progress.current, campaign.length - 1);
  currentIndexRef.current = currentIndex;
  progressRef.current = progress;
  const level = useMemo(() => {
    if (theme === "makeup") return localizeLevel(MAKEUP_LEVEL, locale);
    return campaign[currentIndex];
  }, [theme, locale, campaign, currentIndex]);
  const isLastLevel = currentIndex >= campaign.length - 1;
  const unlockedCount = Math.min(progress.unlocked, campaign.length);

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  function buildUiState(nextLevel = level, nextProgress = progress) {
    const movable = nextLevel.items.filter((item) => !item.fixed);
    const movableTotal = movable.length;
    // Count "picky" items — those with hard rules the player must satisfy.
    const hasRule = (it) => {
      const p = it.prefs || {};
      return !!(p.needsCold || p.zone || p.likesNeighbors?.length || p.hatesNeighbors?.length || p.likesVisible);
    };
    const pickyTotal = movable.filter(hasRule).length;
    return {
      locale,
      phase: nextLevel.phase || 1,
      coins: nextProgress.coins || 0,
      placed: hud.placed,
      total: movableTotal,
      title: nextLevel.theme.title,
      subtitle: nextLevel.theme.subtitle,
      goal: pickyTotal > 0 ? i18n.ui.constraintGoalText(pickyTotal) : i18n.ui.goalDefault,
      toast: nextLevel.copy?.intro || i18n.ui.dragHint,
      currentIndex,
      unlockedCount,
      showCampaignControls: !editMode && theme !== "makeup",
      phases: campaign.map((entry) => ({
        id: entry.id,
        phase: entry.phase,
        title: entry.theme.title,
      })),
    };
  }

  function updateProgress(patch) {
    setProgress((prev) => {
      const resolvedPatch = typeof patch === "function" ? patch(prev) : patch;
      const next = {
        ...prev,
        ...resolvedPatch,
      };
      next.unlocked = Math.max(1, Math.min(campaign.length, next.unlocked));
      next.current = Math.max(0, Math.min(next.unlocked - 1, next.current));
      next.coins = Math.max(0, next.coins);
      if (theme !== "makeup") writeProgress(locale, next);
      return next;
    });
  }

  function handleMetaChange(nextMeta) {
    setMeta(nextMeta);
    writeMeta(nextMeta);
  }

  function addCoins(delta) {
    updateProgress((prev) => ({ coins: prev.coins + delta }));
  }

  function spendCoins(amount) {
    if (progressRef.current.coins < amount) return false;
    updateProgress((prev) => ({ coins: prev.coins - amount }));
    return true;
  }

  function showDiscovery(itemId) {
    setDiscovery(itemId);
    if (discoveryTimerRef.current) clearTimeout(discoveryTimerRef.current);
    discoveryTimerRef.current = setTimeout(() => setDiscovery(null), 2600);
  }

  function nudge(dx, dy) {
    sceneRef.current?.nudgeSelectedSlot(dx, dy);
  }

  function resize(dw, dh) {
    sceneRef.current?.resizeSelectedSlot(dw, dh);
  }

  function baseline(delta) {
    sceneRef.current?.shiftSelectedBaseline(delta);
  }

  function replayLevel() {
    soundRef.current?.phase();
    setComplete(false);
    setLastReward(0);
    setLastStars(0);
    setMessage(level.copy?.intro || i18n.ui.dragHint);
    pendingFreshRef.current = true;
    setReloadToken((prev) => prev + 1);
  }

  function goNextLevel() {
    if (theme === "makeup") return;
    const nextIndex = Math.min(currentIndex + 1, campaign.length - 1);
    soundRef.current?.phase();
    pendingFreshRef.current = true;
    updateProgress({ current: nextIndex });
    setComplete(false);
    setLastReward(0);
    setLastStars(0);
    setMessage(campaign[nextIndex].copy?.intro || i18n.ui.newPhase);
  }

  function jumpToLevel(index) {
    if (theme === "makeup") return;
    const unlocked = Math.min(progressRef.current.unlocked, campaign.length);
    if (index > unlocked - 1) return;
    soundRef.current?.phase();
    updateProgress({ current: index });
    setComplete(false);
    setLastReward(0);
    setLastStars(0);
    setMessage(campaign[index].copy?.intro || i18n.ui.newPhase);
  }

  function resetCampaign() {
    if (theme === "makeup") return;
    soundRef.current?.miss();
    for (const entry of FRIDGE_BR_CAMPAIGN) localStorage.removeItem(`seedbound.storage.${entry.id}`);
    updateProgress({ unlocked: 1, coins: 125, current: 0 });
    setComplete(false);
    setLastReward(0);
    setLastStars(0);
    setMessage(campaign[0].copy?.intro || i18n.ui.dragHint);
    pendingFreshRef.current = true;
    setReloadToken((prev) => prev + 1);
  }

  function useHint() {
    if (theme === "makeup" || complete) return;
    if (progress.coins < HINT_COST) {
      setMessage(i18n.ui.hintNoCoins(HINT_COST));
      return;
    }
    const result = sceneRef.current?.showHint?.();
    if (!result?.ok) {
      setMessage(result?.message || i18n.ui.hintUnavailable);
      return;
    }
    soundRef.current?.phase();
    updateProgress((prev) => ({ coins: prev.coins - HINT_COST }));
    setMessage(i18n.ui.hintUsed(HINT_COST));
  }

  const UNDO_COST = 5;
  const BEST_COST = 15;
  const SKIP_COST = 50;

  function useUndo() {
    if (theme === "makeup" || complete) return;
    if (progress.coins < UNDO_COST) {
      setMessage(i18n.ui.hintNoCoins(UNDO_COST));
      return;
    }
    const result = sceneRef.current?.performUndo?.();
    if (!result?.ok) {
      setMessage(result?.message || i18n.ui.undoNone);
      return;
    }
    soundRef.current?.snap();
    updateProgress((prev) => ({ coins: prev.coins - UNDO_COST }));
    setMessage(i18n.ui.undoOk);
  }

  function useBestSpot() {
    if (theme === "makeup" || complete) return;
    if (progress.coins < BEST_COST) {
      setMessage(i18n.ui.hintNoCoins(BEST_COST));
      return;
    }
    const result = sceneRef.current?.showBestSpot?.();
    if (!result?.ok) {
      setMessage(result?.message || i18n.ui.hintUnavailable);
      return;
    }
    soundRef.current?.phase();
    updateProgress((prev) => ({ coins: prev.coins - BEST_COST }));
    setMessage(i18n.ui.bestSpotCost(BEST_COST));
  }

  function useSkip() {
    if (theme === "makeup" || complete) return;
    if (progress.coins < SKIP_COST) {
      setMessage(i18n.ui.hintNoCoins(SKIP_COST));
      return;
    }
    soundRef.current?.phase();
    updateProgress((prev) => ({ coins: prev.coins - SKIP_COST }));
    setMessage(i18n.ui.skipConfirm);
    sceneRef.current?.performSkip?.();
  }

  async function copyJson() {
    if (!editorJson) return;
    try {
      await navigator.clipboard.writeText(editorJson);
      setCopyState(i18n.ui.copied);
      window.setTimeout(() => setCopyState(i18n.ui.copyJson), 1200);
    } catch {
      setCopyState(i18n.ui.copyFailed);
      window.setTimeout(() => setCopyState(i18n.ui.copyJson), 1200);
    }
  }

  useEffect(() => {
    const sounds = createUiSounds();
    soundRef.current = sounds;
    const unlock = () => sounds.unlock();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      sounds.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    const forceFresh = pendingFreshRef.current;
    pendingFreshRef.current = false;
    setBootVariant(hasMountedOnceRef.current ? "swap" : "initial");
    setBooting(true);
    mount.current.replaceChildren();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mount.current,
      width: 750,
      height: 1334,
      backgroundColor: (theme !== "makeup" && skinById(metaRef.current.shop.equipped).background) || level.theme.background || "#ffecc8",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      audio: { noAudio: true },
      scene: [StorageScene],
    });
    gameRef.current = game;
    if (import.meta.env.DEV) {
      window.__seedboundFridge = { getGame: () => gameRef.current };
    }

    const startTimer = setInterval(() => {
      const scene = game.scene.getScene("storage");
      if (scene?.scene?.isActive()) {
        sceneRef.current = scene;
        scene.events.on("hud", setHud);
        scene.events.on("snap", (payload) => {
          soundRef.current?.snap();
          setMessage(i18n.ui.snapOk);
          const discoverId = payload?.image || payload?.item;
          if (theme !== "makeup" && discoverId) {
            const { meta: nextMeta, isNew } = discoverItem(metaRef.current, discoverId);
            if (isNew) {
              handleMetaChange(nextMeta);
              soundRef.current?.fanfare?.();
              showDiscovery(payload.item);
            }
          }
        });
        scene.events.on("miss", (event) => {
          soundRef.current?.miss();
          setMessage(event.message);
        });
        scene.events.on("callout", (type) => {
          if (type === "fanfare") {
            soundRef.current?.fanfare();
            soundRef.current?.impact();
          } else if (type === "snap") {
            soundRef.current?.comboRising(2);
          }
        });
        scene.events.on("editor-change", setEditorJson);
        scene.events.on("editor-selection", setSelectedSlot);
        scene.events.on("jump-phase", jumpToLevel);
        scene.events.on("replay-level", replayLevel);
        scene.events.on("reset-campaign", resetCampaign);
        if (scene.engine) {
          const validation = scene.engine.validate();
          setHud({ placed: validation.packed, total: validation.total });
        }
        scene.updateChrome?.(buildUiState(level));
        if (theme !== "makeup") scene.applySkin?.(skinById(metaRef.current.shop.equipped));
        hasMountedOnceRef.current = true;
        setBooting(false);
        if (editMode) {
          setEditorJson(scene.exportLevel?.() || "");
          if (scene.selectedSlotId && scene.findSlot) {
            const slot = scene.findSlot(scene.selectedSlotId);
            if (slot && scene.editorSlotPayload) setSelectedSlot(scene.editorSlotPayload(slot));
          }
        }
        clearInterval(startTimer);
      }
    }, 50);

    game.events.on("game-success", (detail) => {
      if (detail.stars >= 3) {
        soundRef.current?.fanfare();
      } else {
        soundRef.current?.success();
      }
      setComplete(true);
      setLastReward(detail.gold || 0);
      setLastStars(detail.stars || 1);
      const starText = i18n.ui.starLabel(detail.stars || 1);
      if (detail.stars >= 3) {
        setMessage(`${i18n.ui.successPerfect} +${detail.gold} ${starText}`);
      } else {
        setMessage(`${i18n.ui.successCoins(detail.gold)} ${starText}`);
      }
      if (theme !== "makeup") {
        updateProgress((prev) => ({
          coins: prev.coins + detail.gold,
          unlocked: Math.max(prev.unlocked, Math.min(campaign.length, currentIndexRef.current + 2)),
        }));
        const cleanRun = (detail.mistakes || 0) === 0 && (detail.stars || 0) >= 2;
        const { meta: nextMeta } = bumpStreak(metaRef.current, cleanRun);
        handleMetaChange(nextMeta);
      }
    });

    // Callout sound effects
    game.events.on("callout", (detail) => {
      if (detail.style === "fire") {
        soundRef.current?.fanfare();
        soundRef.current?.impact();
      } else if (detail.style === "gold") {
        soundRef.current?.fanfare();
      } else if (detail.style === "ice") {
        soundRef.current?.comboRising(1);
      } else {
        soundRef.current?.snap();
      }
    });
    game.scene.start("storage", {
      editMode,
      level,
      forceFresh,
      uiState: buildUiState(level, progress),
    });

    // Fallback: force-dismiss boot overlay if scene doesn't report active in 4s
    const bootFallback = setTimeout(() => {
      setBooting(false);
      hasMountedOnceRef.current = true;
    }, 4000);

    return () => {
      clearTimeout(bootFallback);
      clearInterval(startTimer);
      if (import.meta.env.DEV) delete window.__seedboundFridge;
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
      mount.current?.replaceChildren();
    };
  }, [theme, currentIndex, reloadToken, editMode]);

  useEffect(() => {
    setHud({ placed: 0, total: level.items.filter((item) => !item.fixed).length });
    placedRef.current = 0;
    setLastReward(0);
    setMessage(level.copy?.intro || i18n.ui.dragHint);
  }, [currentIndex, reloadToken, level, i18n.ui.dragHint]);

  useEffect(() => {
    if (complete) {
      placedRef.current = hud.placed;
      return;
    }
    if (hud.placed > placedRef.current) {
      if (hud.total > 1 && hud.placed === hud.total - 1) {
        setMessage(i18n.ui.oneMoreItem);
      } else {
        setMessage(i18n.ui.snapOk);
      }
    }
    placedRef.current = hud.placed;
  }, [complete, hud.placed, hud.total, i18n.ui.oneMoreItem, i18n.ui.snapOk]);

  useEffect(() => {
    sceneRef.current?.applyLocale?.(locale, level, buildUiState(level, progress));
  }, [locale, level]);

  useEffect(() => {
    sceneRef.current?.updateChrome?.(buildUiState(level, progress));
  }, [progress.coins, progress.unlocked, progress.current, hud.placed, hud.total, level]);

  useEffect(() => {
    if (theme === "makeup") return;
    sceneRef.current?.applySkin?.(skinById(meta.shop.equipped));
  }, [meta.shop.equipped, theme]);

  function changeLocale(nextLocale, event) {
    event.preventDefault();
    if (!localeSwitcherEnabled) return;
    if (nextLocale === locale) return;
    writeLocalePreference(nextLocale);
    if (theme !== "makeup") writeProgress(nextLocale, progressRef.current);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    setComplete(false);
    setLocale(nextLocale);
  }

  const search = window.location.search;
  return (
    <main className="fridge-shell">
      {!editMode && theme !== "makeup" && (
        <>
          {localeSwitcherEnabled && <nav className="fridge-lang-switch" aria-label="Language">
            <a className={locale === "pt" ? "active" : ""} href={switchLocaleHref("pt", search)} onClick={(event) => changeLocale("pt", event)}>{i18n.ui.langPt}</a>
            <a className={locale === "en" ? "active" : ""} href={switchLocaleHref("en", search)} onClick={(event) => changeLocale("en", event)}>{i18n.ui.langEn}</a>
            <a className={locale === "cn" ? "active" : ""} href={switchLocaleHref("cn", search)} onClick={(event) => changeLocale("cn", event)}>{i18n.ui.langCn}</a>
          </nav>}
          <div className="fridge-quick-actions">
            <button
              type="button"
              className="fridge-quick-btn"
              onClick={replayLevel}
              title={i18n.ui.replayLevelLabel}
              aria-label={i18n.ui.replayLevelLabel}
              data-icon="↻"
            >
              <span>{i18n.ui.replayLevelLabel}</span>
            </button>
            <button
              type="button"
              className="fridge-quick-pill"
              onClick={useUndo}
              title={i18n.ui.undoCost(UNDO_COST)}
              aria-label={i18n.ui.undoLabel}
              disabled={complete || progress.coins < UNDO_COST}
            >
              <strong>{i18n.ui.undoLabel}</strong>
              <span>{UNDO_COST}</span>
            </button>
            <button
              type="button"
              className={`fridge-quick-pill${progress.coins <= LOW_COINS_HINT ? " low-coins" : ""}`}
              onClick={useHint}
              title={i18n.ui.hintCost(HINT_COST)}
              aria-label={i18n.ui.hintLabel}
              disabled={complete || progress.coins < HINT_COST}
            >
              <strong>{i18n.ui.hintLabel}</strong>
              <span>{HINT_COST}</span>
            </button>
            <button
              type="button"
              className="fridge-quick-pill accent"
              onClick={useBestSpot}
              title={i18n.ui.bestSpotCost(BEST_COST)}
              aria-label={i18n.ui.bestSpotLabel}
              disabled={complete || progress.coins < BEST_COST}
            >
              <strong>{i18n.ui.bestSpotLabel}</strong>
              <span>{BEST_COST}</span>
            </button>
            <button
              type="button"
              className="fridge-quick-pill danger"
              onClick={useSkip}
              title={i18n.ui.skipCost(SKIP_COST)}
              aria-label={i18n.ui.skipLabel}
              disabled={complete || progress.coins < SKIP_COST}
            >
              <strong>{i18n.ui.skipLabel}</strong>
              <span>{SKIP_COST}</span>
            </button>
          </div>
          <MetaLayer
            i18n={i18n}
            locale={locale}
            coins={progress.coins}
            meta={meta}
            onMetaChange={handleMetaChange}
            onAddCoins={addCoins}
            onSpendCoins={spendCoins}
            discovery={discovery}
            autoOpenDaily={autoOpenDaily}
            onDailyAutoHandled={() => setAutoOpenDaily(false)}
          />
        </>
      )}
      <div className="fridge-game-mount" ref={mount} />
      <div className={`fridge-boot-overlay fridge-boot-overlay--${bootVariant}${booting ? " visible" : ""}`} aria-hidden={!booting}>
        <div className="fridge-boot-overlay__veil" />
        <div className="fridge-boot-overlay__card">
          <div className="fridge-boot-badge">Seedbound</div>
          <div className="fridge-boot-portal" aria-hidden="true">
            <div className="fridge-boot-portal__glow" />
            <div className="fridge-boot-portal__frame">
              <div className="fridge-boot-portal__shelves">
                <span />
                <span />
                <span />
              </div>
              <div className="fridge-boot-portal__door">
                <span />
                <span />
                <span />
              </div>
              <div className="fridge-boot-portal__items">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
          <strong>{level.theme.title}</strong>
          <p>{level.copy?.intro || i18n.ui.dragHint}</p>
        </div>
      </div>
      {complete && (
        <section className="fridge-result fridge-result--celebrate">
          <div className="fridge-result-sparkles" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <small>{level.copy?.successTag || i18n.ui.successTag}</small>
          <div className="fridge-result-stars" aria-label={i18n.ui.starLabel(lastStars)}>
            {[1, 2, 3].map((n) => (
              <span key={n} className={n <= lastStars ? "earned" : ""}>★</span>
            ))}
          </div>
          <h1>{level.copy?.successTitle || i18n.ui.successTitle}</h1>
          {!!lastReward && <div className="fridge-result-reward">+{lastReward} coins</div>}
          <p>{level.copy?.successBody || i18n.ui.successBody}</p>
          <div className="fridge-result-actions">
            {!isLastLevel && <button onClick={goNextLevel}>{level.copy?.nextLabel || i18n.ui.nextLabel}</button>}
            <button className="secondary" onClick={replayLevel}>{level.copy?.retryLabel || i18n.ui.retryLabel}</button>
          </div>
        </section>
      )}
      {editMode && (
        <aside className="fridge-editor">
          <div className="fridge-editor-head">
            <b>Slot Editor</b>
            <button type="button" onClick={copyJson}>{copyState}</button>
          </div>
          {selectedSlot && (
            <section className="fridge-editor-controls">
              <div className="fridge-editor-chip">{selectedSlot.id}</div>
              <div className="fridge-editor-meta">
                <span>{selectedSlot.zone}</span>
                <span>x {selectedSlot.x}</span>
                <span>y {selectedSlot.y}</span>
                <span>w {selectedSlot.w}</span>
                <span>h {selectedSlot.h}</span>
                <span>base {selectedSlot.baseline.toFixed(2)}</span>
              </div>
              <div className="fridge-editor-grid">
                <button type="button" onClick={() => nudge(0, -2)}>Up</button>
                <button type="button" onClick={() => nudge(-2, 0)}>Left</button>
                <button type="button" onClick={() => nudge(2, 0)}>Right</button>
                <button type="button" onClick={() => nudge(0, 2)}>Down</button>
              </div>
              <div className="fridge-editor-row">
                <button type="button" onClick={() => resize(-4, 0)}>Width -</button>
                <button type="button" onClick={() => resize(4, 0)}>Width +</button>
                <button type="button" onClick={() => resize(0, -4)}>Height -</button>
                <button type="button" onClick={() => resize(0, 4)}>Height +</button>
              </div>
              <div className="fridge-editor-row">
                <button type="button" onClick={() => baseline(-0.01)}>Base -</button>
                <button type="button" onClick={() => baseline(0.01)}>Base +</button>
              </div>
            </section>
          )}
          <textarea readOnly value={editorJson} />
        </aside>
      )}
    </main>
  );
}
