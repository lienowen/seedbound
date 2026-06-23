import { useEffect, useMemo, useRef, useState } from "react";
import Phaser from "phaser";
import { StorageScene } from "./game/StorageScene.js";
import { createUiSounds } from "./game/playFeedback.js";
import { FRIDGE_BR_CAMPAIGN, MAKEUP_LEVEL } from "./levels/fridgePhaserLevel.js";
import { createI18n, localizeCampaign, localizeLevel } from "./i18n/index.js";
import { htmlLang, parseLocale, progressStorageKey, switchLocaleHref } from "./i18n/locale.js";

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
  const locale = useMemo(() => parseLocale(window.location.pathname), []);
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
  const placedRef = useRef(0);
  const currentIndexRef = useRef(0);
  const progressRef = useRef(progress);

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
    return {
      locale,
      phase: nextLevel.phase || 1,
      coins: nextProgress.coins || 0,
      placed: hud.placed,
      total: nextLevel.items.filter((item) => !item.fixed).length,
      title: nextLevel.theme.title,
      subtitle: nextLevel.theme.subtitle,
      goal: nextLevel.copy?.goal || nextLevel.goal || i18n.ui.goalDefault,
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
    setMessage(campaign[nextIndex].copy?.intro || i18n.ui.newPhase);
  }

  function jumpToLevel(index) {
    if (theme === "makeup") return;
    const unlocked = Math.min(progressRef.current.unlocked, campaign.length);
    if (index > unlocked - 1) return;
    soundRef.current?.phase();
    updateProgress({ current: index });
    setComplete(false);
    setMessage(campaign[index].copy?.intro || i18n.ui.newPhase);
  }

  function resetCampaign() {
    if (theme === "makeup") return;
    soundRef.current?.miss();
    for (const entry of FRIDGE_BR_CAMPAIGN) localStorage.removeItem(`seedbound.storage.${entry.id}`);
    updateProgress({ unlocked: 1, coins: 125, current: 0 });
    setComplete(false);
    setMessage(campaign[0].copy?.intro || i18n.ui.dragHint);
    pendingFreshRef.current = true;
    setReloadToken((prev) => prev + 1);
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
    mount.current.replaceChildren();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mount.current,
      width: 750,
      height: 1334,
      backgroundColor: level.theme.background || "#ffecc8",
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
        scene.events.on("snap", () => {
          soundRef.current?.snap();
          setMessage(i18n.ui.snapOk);
        });
        scene.events.on("miss", (event) => {
          soundRef.current?.miss();
          setMessage(event.message);
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
      soundRef.current?.success();
      setComplete(true);
      setMessage(i18n.ui.successCoins(detail.gold));
      if (theme !== "makeup") {
        updateProgress((prev) => ({
          coins: prev.coins + detail.gold,
          unlocked: Math.max(prev.unlocked, Math.min(campaign.length, currentIndexRef.current + 2)),
        }));
      }
    });
    game.scene.start("storage", {
      editMode,
      level,
      forceFresh,
      uiState: buildUiState(level, progress),
    });

    return () => {
      clearInterval(startTimer);
      if (import.meta.env.DEV) delete window.__seedboundFridge;
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
      mount.current?.replaceChildren();
    };
  }, [theme, locale, currentIndex, reloadToken, editMode]);

  useEffect(() => {
    setHud({ placed: 0, total: level.items.filter((item) => !item.fixed).length });
    placedRef.current = 0;
    setMessage(level.copy?.intro || i18n.ui.dragHint);
  }, [currentIndex, reloadToken, level, i18n.ui.dragHint]);

  useEffect(() => {
    if (complete) {
      placedRef.current = hud.placed;
      return;
    }
    if (hud.placed > placedRef.current) {
      setMessage(i18n.ui.snapOk);
    }
    placedRef.current = hud.placed;
  }, [complete, hud.placed, i18n.ui.snapOk]);

  useEffect(() => {
    sceneRef.current?.updateChrome?.(buildUiState(level, progress));
  }, [level, progress, hud.placed, hud.total, locale]);

  const search = window.location.search;

  return (
    <main className="fridge-shell">
      {!editMode && theme !== "makeup" && (
        <nav className="fridge-lang-switch" aria-label="Language">
          <a className={locale === "pt" ? "active" : ""} href={switchLocaleHref("pt", search)}>{i18n.ui.langPt}</a>
          <a className={locale === "en" ? "active" : ""} href={switchLocaleHref("en", search)}>{i18n.ui.langEn}</a>
          <a className={locale === "cn" ? "active" : ""} href={switchLocaleHref("cn", search)}>{i18n.ui.langCn}</a>
        </nav>
      )}
      <div className="fridge-game-mount" ref={mount} />
      {complete && (
        <section className="fridge-result">
          <small>{level.copy?.successTag || i18n.ui.successTag}</small>
          <h1>{level.copy?.successTitle || i18n.ui.successTitle}</h1>
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

