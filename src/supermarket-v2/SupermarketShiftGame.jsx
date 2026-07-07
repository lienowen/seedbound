import { useMemo, useRef, useState } from "react";
import { assetUrl } from "../assetBase.js";
import { SUPERMARKET_V2_VERTICAL_SLICE } from "./data/verticalSlice.js";
import { ShiftEngine } from "./model/shiftEngine.js";
import { FIXTURE_KIND, getSku, visibleGapCount } from "./model/storeModel.js";
import "./supermarket-v2.css";

const REASON_COPY = {
  "shift-not-working": "Start the shift first.",
  "must-load-in-backroom": "Cases can only be loaded in the backroom.",
  "wrong-scene": "You are in the wrong department for that shelf.",
  "wrong-department-or-fixture": "That product belongs in another department.",
  "no-shelf-capacity": "That shelf is already full. Extra stock belongs in backstock.",
  "unit-not-on-cart": "That unit is no longer on the stock cart.",
  "required-work-incomplete": "There is still required work on the shift list.",
};

function productAsset(skuId) {
  return assetUrl(`tidy/${skuId}.png`);
}

function ProductImage({ skuId, className = "" }) {
  const [failed, setFailed] = useState(false);
  const sku = getSku(skuId);

  if (failed) {
    return (
      <span className={`v2-product-fallback ${className}`} aria-label={sku?.label || skuId}>
        {(sku?.label || skuId).slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={productAsset(skuId)}
      alt={sku?.label || skuId}
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}

function formatShiftClock(baseClock, elapsedSeconds) {
  const [hours, minutes] = String(baseClock || "07:00").split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + Math.floor(Number(elapsedSeconds || 0) / 60);
  const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function taskProgress(state) {
  const required = state.tasks.filter((task) => !task.optional);
  return {
    done: required.filter((task) => task.complete).length,
    total: required.length,
  };
}

function sceneName(scene) {
  if (!scene) return "Shop floor";
  if (scene.kind === "backroom") return "Backroom";
  if (scene.department === "breakfast") return "Breakfast aisle";
  if (scene.department === "dairy") return "Dairy wall";
  if (scene.department === "drinks") return "Drinks wall";
  return scene.department || "Shop floor";
}

function bayName(bay) {
  if (bay?.department === "breakfast") return "BREAKFAST";
  if (bay?.department === "dairy") return "DAIRY";
  if (bay?.department === "drinks") return "DRINKS";
  return String(bay?.department || "SHELF").toUpperCase();
}

function Briefing({ shift, onStart }) {
  return (
    <section className="v2-briefing-card" aria-label="Shift briefing">
      <div className="v2-briefing-eyebrow">{shift.briefing.clock} · Staff entrance</div>
      <h1>{shift.title}</h1>
      <p className="v2-role">{shift.briefing.role}</p>
      <div className="v2-priority-sheet">
        <strong>Today&apos;s priority</strong>
        {shift.briefing.priorities.map((priority) => (
          <div className="v2-priority-row" key={priority}>
            <span className="v2-priority-dot" />
            <span>{priority}</span>
          </div>
        ))}
      </div>
      <p className="v2-briefing-note">Collect only the priority stock, work one department at a time, recover visible gaps, then face each shelf before leaving.</p>
      <button className="v2-primary-button" type="button" onClick={onStart}>Clock in</button>
    </section>
  );
}

function ShiftHeader({ shift, state, scene }) {
  const progress = taskProgress(state);
  return (
    <header className="v2-shift-header">
      <div>
        <span className="v2-shift-kicker">{shift.briefing.role}</span>
        <strong>{shift.title}</strong>
      </div>
      <div className="v2-shift-header-right">
        <span className="v2-location-pill">{sceneName(scene)}</span>
        <span className="v2-clock">{formatShiftClock(shift.briefing.clock, state.clockSeconds)}</span>
        <span className="v2-progress-pill">{progress.done}/{progress.total}</span>
      </div>
    </header>
  );
}

function BackroomScene({ state, nextScene, onLoadCase, onLeave }) {
  const unloaded = state.cases.filter((stockCase) => !stockCase.loaded);
  const allLoaded = unloaded.length === 0;

  return (
    <section className="v2-scene v2-backroom-scene">
      <div className="v2-backroom-wall" aria-hidden="true">
        <div className="v2-backroom-sign">BACKROOM · MORNING RECEIVING</div>
        <div className="v2-backroom-rack-lines"><span /><span /><span /></div>
      </div>

      <div className="v2-scene-copy v2-scene-copy--left">
        <span>Step 1</span>
        <h2>Load the stock cart</h2>
        <p>Take only the cases listed for this shift.</p>
      </div>

      <div className={`v2-case-rack ${state.cases.length > 3 ? "v2-case-rack--four" : ""}`} aria-label="Backroom cases">
        {state.cases.map((stockCase) => {
          const sku = getSku(stockCase.skuId);
          return (
            <button
              className={`v2-case ${stockCase.loaded ? "is-loaded" : ""}`}
              key={stockCase.id}
              type="button"
              disabled={stockCase.loaded}
              onClick={() => onLoadCase(stockCase.id)}
            >
              <span className="v2-case-tape" />
              <ProductImage skuId={stockCase.skuId} className="v2-case-product" />
              <span className="v2-case-copy">
                <strong>{sku?.label}</strong>
                <small>{stockCase.loaded ? "Loaded" : `Case · ${stockCase.quantity} unit${stockCase.quantity === 1 ? "" : "s"}`}</small>
              </span>
            </button>
          );
        })}
      </div>

      <StockCart state={state} compact />

      <div className="v2-scene-action">
        <span>{allLoaded ? "Cart ready" : `${unloaded.length} case${unloaded.length === 1 ? "" : "s"} still on rack`}</span>
        <button className="v2-primary-button" type="button" disabled={!allLoaded || !nextScene} onClick={onLeave}>
          Push cart to {sceneName(nextScene)}
        </button>
      </div>
    </section>
  );
}

function StockCart({ state, compact = false, drag, onDragStart, onDragMove, onDragEnd }) {
  return (
    <div className={`v2-stock-cart ${compact ? "v2-stock-cart--backroom" : "v2-stock-cart--floor"}`}>
      <div className="v2-cart-handle" />
      <div className="v2-cart-label">{compact ? "STOCK CART" : "YOUR CART"} <span>{state.cart.length} units</span></div>
      <div className={`v2-cart-deck ${compact ? "" : "v2-cart-deck--draggable"}`}>
        {state.cart.length === 0 ? (
          <span className="v2-cart-empty">{compact ? "Tap each case to load it" : "Cart empty"}</span>
        ) : compact ? (
          state.cart.map((unit) => (
            <div className="v2-cart-mini-unit" key={unit.id}>
              <ProductImage skuId={unit.skuId} />
            </div>
          ))
        ) : (
          state.cart.map((unit) => (
            <button
              className={`v2-draggable-unit ${drag?.unitId === unit.id ? "is-dragging" : ""}`}
              key={unit.id}
              type="button"
              onPointerDown={(event) => onDragStart(event, unit)}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              <ProductImage skuId={unit.skuId} />
              <small>{getSku(unit.skuId)?.label}</small>
            </button>
          ))
        )}
      </div>
      <div className="v2-cart-wheel v2-cart-wheel--a" />
      <div className="v2-cart-wheel v2-cart-wheel--b" />
    </div>
  );
}

function FacingProduct({ facing, index, faced }) {
  return (
    <div
      className={`v2-facing-cell is-filled v2-facing-span-${Math.max(1, Number(facing.footprint || 1))}`}
      style={{ gridColumn: `span ${Math.max(1, Number(facing.footprint || 1))}` }}
    >
      <div className={`v2-shelf-product ${faced ? "is-faced" : `is-unfaced is-unfaced-${index % 3}`}`}>
        <ProductImage skuId={facing.skuId} />
      </div>
    </div>
  );
}

function FacingGrid({ bay }) {
  const usedCells = bay.facings.reduce((sum, facing) => sum + Math.max(1, Number(facing.footprint || 1)), 0);
  const gaps = Math.max(0, bay.capacity - usedCells);

  return (
    <div className="v2-facing-row" data-bay-id={bay.id} style={{ gridTemplateColumns: `repeat(${bay.capacity}, minmax(0, 1fr))` }}>
      {bay.facings.map((facing, index) => (
        <FacingProduct key={facing.unitId} facing={facing} index={index} faced={!!bay.faced} />
      ))}
      {Array.from({ length: gaps }, (_, index) => (
        <div className="v2-facing-cell is-gap" key={`gap-${index}`}>
          <div className="v2-visible-gap"><span /><small>GAP</small></div>
        </div>
      ))}
    </div>
  );
}

function WallCoolerFixture({ bay }) {
  const full = visibleGapCount(bay) === 0;
  return (
    <div className={`v2-wall-cooler ${full ? "is-full" : ""}`}>
      <div className="v2-cooler-top">
        <strong>{bayName(bay)}</strong>
        <span>Wall cooler · {bay.capacity} facings</span>
      </div>
      <div className="v2-cooler-light" />
      <div className="v2-cooler-interior" data-bay-id={bay.id}>
        <FacingGrid bay={bay} />
        <div className="v2-shelf-lip"><span>{bayName(bay)} · KEEP CHILLED</span></div>
      </div>
      <div className="v2-cooler-foot" />
    </div>
  );
}

function DryShelfFixture({ bay }) {
  return (
    <div className="v2-dry-shelf" data-bay-id={bay.id}>
      <div className="v2-dry-shelf-header">
        <strong>{bayName(bay)}</strong>
        <span>Dry aisle · ambient stock</span>
      </div>
      <div className="v2-dry-shelf-back" data-bay-id={bay.id}>
        <FacingGrid bay={bay} />
        <div className="v2-dry-shelf-lip"><span>{bayName(bay)} · AISLE BAY</span></div>
      </div>
      <div className="v2-dry-shelf-base" />
    </div>
  );
}

function DepartmentScene({ scene, state, bay, nextScene, drag, onDragStart, onDragMove, onDragEnd, onFace, onMoveNext }) {
  const gaps = visibleGapCount(bay);
  const full = gaps === 0;
  const dry = bay.kind === FIXTURE_KIND.DRY_SHELF;

  return (
    <section className={`v2-scene ${dry ? "v2-dry-aisle-scene" : "v2-drinks-scene"}`}>
      <div className={dry ? "v2-dry-aisle-wall" : "v2-store-wall"} aria-hidden="true">
        <div className={dry ? "v2-dry-aisle-line" : "v2-store-wall-line"} />
      </div>

      <div className="v2-scene-copy">
        <span>{sceneName(scene)}</span>
        <h2>{full ? "Finish the bay" : "Recover the visible gaps"}</h2>
        <p>{full ? (bay.faced ? "Bay complete. Move to the next priority." : "Stock is in. Face products forward before leaving.") : `${gaps} visible gap${gaps === 1 ? "" : "s"} remain.`}</p>
      </div>

      {dry ? <DryShelfFixture bay={bay} /> : <WallCoolerFixture bay={bay} />}

      <StockCart
        state={state}
        drag={drag}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />

      {full && !bay.faced ? (
        <div className="v2-face-action">
          <span>Products are stocked but still uneven.</span>
          <button className="v2-primary-button" type="button" onClick={onFace}>Face the shelf</button>
        </div>
      ) : null}

      {bay.faced && nextScene ? (
        <div className="v2-department-next">
          <span>{bayName(bay)} complete</span>
          <button className="v2-primary-button" type="button" onClick={onMoveNext}>Push cart to {sceneName(nextScene)}</button>
        </div>
      ) : null}

      {drag ? (
        <div className="v2-drag-ghost" style={{ left: drag.clientX, top: drag.clientY }}>
          <ProductImage skuId={drag.skuId} />
        </div>
      ) : null}
    </section>
  );
}

function CompletionOverlay({ shift, score, onReset }) {
  return (
    <section className="v2-complete-card">
      <span className="v2-complete-check">✓</span>
      <h2>{shift.title} complete</h2>
      <p>Priority bays are stocked, faced and ready for customers.</p>
      <div className="v2-score-grid">
        <div><strong>{score.availability}%</strong><span>Availability</span></div>
        <div><strong>{score.accuracy}%</strong><span>Accuracy</span></div>
        <div><strong>{score.facing}%</strong><span>Facing</span></div>
      </div>
      <button className="v2-primary-button" type="button" onClick={onReset}>Replay shift</button>
    </section>
  );
}

function nextWorkSceneId(state) {
  for (const task of state.tasks) {
    if (task.complete || task.optional || !task.bayId) continue;
    const bay = state.bays[task.bayId];
    if (bay?.sceneId) return bay.sceneId;
  }
  return null;
}

export function SupermarketShiftGame() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const requested = Number(params.get("shift") || 1);
  const shiftNumber = Math.max(1, Math.min(2, Number.isFinite(requested) ? requested : 1));
  const shift = SUPERMARKET_V2_VERTICAL_SLICE[shiftNumber - 1];
  const engineRef = useRef(new ShiftEngine(shift));
  const shiftIdRef = useRef(shift.id);

  if (shiftIdRef.current !== shift.id) {
    engineRef.current = new ShiftEngine(shift);
    shiftIdRef.current = shift.id;
  }

  const [state, setState] = useState(() => engineRef.current.snapshot());
  const [message, setMessage] = useState("Read the priority card, then clock in.");
  const [drag, setDrag] = useState(null);
  const [score, setScore] = useState(null);

  const engine = engineRef.current;
  const scene = shift.scenes.find((entry) => entry.id === state.currentSceneId) || null;
  const currentBay = Object.values(state.bays).find((bay) => bay.sceneId === state.currentSceneId) || null;
  const nextSceneId = nextWorkSceneId(state);
  const nextScene = shift.scenes.find((entry) => entry.id === nextSceneId) || null;

  function sync(nextMessage = null) {
    setState(engine.snapshot());
    if (nextMessage) setMessage(nextMessage);
  }

  function startShift() {
    const result = engine.startShift();
    sync(result.ok ? "Start in the backroom. Load the priority cases." : REASON_COPY[result.reason] || result.reason);
  }

  function loadCase(caseId) {
    const result = engine.loadCase(caseId);
    sync(result.ok ? "Case loaded onto the stock cart." : REASON_COPY[result.reason] || result.reason);
  }

  function moveToScene(sceneId) {
    if (!sceneId) return;
    const result = engine.moveToScene(sceneId);
    const target = shift.scenes.find((entry) => entry.id === sceneId);
    sync(result.ok ? `Arrived at ${sceneName(target)}. Work the visible gaps.` : REASON_COPY[result.reason] || result.reason);
  }

  function beginDrag(event, unit) {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ unitId: unit.id, skuId: unit.skuId, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY });
  }

  function moveDrag(event) {
    setDrag((current) => {
      if (!current || current.pointerId !== event.pointerId) return current;
      return { ...current, clientX: event.clientX, clientY: event.clientY };
    });
  }

  function endDrag(event) {
    const current = drag;
    setDrag(null);
    if (!current || current.pointerId !== event.pointerId) return;

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-bay-id]");
    const bayId = target?.dataset?.bayId;
    if (!bayId) {
      setMessage("Drop stock onto a visible shelf gap.");
      return;
    }

    const result = engine.placeUnit(current.unitId, bayId);
    if (!result.ok) {
      sync(REASON_COPY[result.reason] || result.reason);
      return;
    }

    const bay = engine.state.bays[bayId];
    const gaps = visibleGapCount(bay);
    sync(result.bayFull ? "Bay stocked. Face the products forward before leaving." : `${gaps} gap${gaps === 1 ? "" : "s"} remain.`);
  }

  function faceCurrentBay() {
    if (!currentBay) return;
    const result = engine.faceBay(currentBay.id);
    if (!result.ok) {
      sync(REASON_COPY[result.reason] || result.reason);
      return;
    }

    const finish = engine.finishShift();
    if (finish.ok) {
      setScore(finish.score);
      sync("Shift complete. Priority bays are ready for customers.");
      return;
    }

    const snapshot = engine.snapshot();
    const upcomingSceneId = nextWorkSceneId(snapshot);
    const upcoming = shift.scenes.find((entry) => entry.id === upcomingSceneId);
    sync(upcoming ? `${bayName(engine.state.bays[currentBay.id])} faced. Next priority: ${sceneName(upcoming)}.` : "Shelf faced. Continue the remaining priority work.");
  }

  function resetShift() {
    engineRef.current = new ShiftEngine(shift);
    shiftIdRef.current = shift.id;
    setState(engineRef.current.snapshot());
    setMessage("Read the priority card, then clock in.");
    setDrag(null);
    setScore(null);
  }

  return (
    <main className="v2-game-shell">
      <ShiftHeader shift={shift} state={state} scene={scene} />

      {state.phase === "briefing" ? (
        <Briefing shift={shift} onStart={startShift} />
      ) : scene?.kind === "backroom" ? (
        <BackroomScene
          state={state}
          nextScene={nextScene}
          onLoadCase={loadCase}
          onLeave={() => moveToScene(nextScene?.id)}
        />
      ) : currentBay ? (
        <DepartmentScene
          scene={scene}
          state={state}
          bay={currentBay}
          nextScene={nextScene?.id === scene?.id ? null : nextScene}
          drag={drag}
          onDragStart={beginDrag}
          onDragMove={moveDrag}
          onDragEnd={endDrag}
          onFace={faceCurrentBay}
          onMoveNext={() => moveToScene(nextScene?.id)}
        />
      ) : (
        <section className="v2-empty-scene">This department scene is not built yet.</section>
      )}

      <div className="v2-message-bar" role="status">{message}</div>
      {score ? <CompletionOverlay shift={shift} score={score} onReset={resetShift} /> : null}

      <button className="v2-reset-link" type="button" onClick={resetShift}>Reset V2 shift</button>
    </main>
  );
}

export default SupermarketShiftGame;
