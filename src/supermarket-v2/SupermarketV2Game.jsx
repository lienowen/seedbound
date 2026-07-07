import { useMemo, useRef, useState } from "react";
import { assetUrl } from "../assetBase.js";
import { SUPERMARKET_V2_VERTICAL_SLICE } from "./data/verticalSlice.js";
import { ShiftEngine } from "./model/shiftEngine.js";
import { getSku, visibleGapCount } from "./model/storeModel.js";
import "./supermarket-v2.css";

const REASON_COPY = {
  "shift-not-working": "Start the shift first.",
  "must-load-in-backroom": "Cases can only be loaded in the backroom.",
  "wrong-scene": "You are in the wrong department for that shelf.",
  "wrong-department-or-fixture": "That product does not belong on this fixture.",
  "no-shelf-capacity": "That shelf is already full. Send extra stock to backstock.",
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
  const done = required.filter((task) => task.complete).length;
  return { done, total: required.length };
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
      <p className="v2-briefing-note">Collect stock from the backroom, move it to the correct department, fill the visible gaps, then face the shelf.</p>
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
        <span className="v2-location-pill">{scene?.kind === "backroom" ? "Backroom" : scene?.department || "Shop floor"}</span>
        <span className="v2-clock">{formatShiftClock(shift.briefing.clock, state.clockSeconds)}</span>
        <span className="v2-progress-pill">{progress.done}/{progress.total}</span>
      </div>
    </header>
  );
}

function BackroomScene({ shift, state, onLoadCase, onLeave }) {
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
        <p>Take only the cases listed for this top-up.</p>
      </div>

      <div className="v2-case-rack" aria-label="Backroom cases">
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
                <small>{stockCase.loaded ? "Loaded" : `Case · ${stockCase.quantity} unit`}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="v2-stock-cart v2-stock-cart--backroom">
        <div className="v2-cart-handle" />
        <div className="v2-cart-label">STOCK CART <span>{state.cart.length} units</span></div>
        <div className="v2-cart-deck">
          {state.cart.length === 0 ? (
            <span className="v2-cart-empty">Tap each case to load it</span>
          ) : (
            state.cart.map((unit) => (
              <div className="v2-cart-mini-unit" key={unit.id}>
                <ProductImage skuId={unit.skuId} />
              </div>
            ))
          )}
        </div>
        <div className="v2-cart-wheel v2-cart-wheel--a" />
        <div className="v2-cart-wheel v2-cart-wheel--b" />
      </div>

      <div className="v2-scene-action">
        <span>{allLoaded ? "Cart ready" : `${unloaded.length} case${unloaded.length === 1 ? "" : "s"} still on rack`}</span>
        <button className="v2-primary-button" type="button" disabled={!allLoaded} onClick={onLeave}>
          Push cart to Drinks Wall
        </button>
      </div>
    </section>
  );
}

function FacingCell({ facing, index, faced }) {
  return (
    <div className={`v2-facing-cell ${facing ? "is-filled" : "is-gap"}`}>
      {facing ? (
        <div className={`v2-shelf-product ${faced ? "is-faced" : `is-unfaced is-unfaced-${index % 3}`}`}>
          <ProductImage skuId={facing.skuId} />
        </div>
      ) : (
        <div className="v2-visible-gap">
          <span />
          <small>GAP</small>
        </div>
      )}
    </div>
  );
}

function DrinksWallScene({ state, bay, drag, onDragStart, onDragMove, onDragEnd, onFace }) {
  const gaps = visibleGapCount(bay);
  const full = gaps === 0;

  return (
    <section className="v2-scene v2-drinks-scene">
      <div className="v2-store-wall" aria-hidden="true">
        <div className="v2-store-wall-line" />
      </div>

      <div className="v2-scene-copy">
        <span>Step 2</span>
        <h2>Recover the visible gaps</h2>
        <p>{full ? "Stock is in. Face the row before you leave." : `${gaps} visible gap${gaps === 1 ? "" : "s"} remain.`}</p>
      </div>

      <div className={`v2-wall-cooler ${full ? "is-full" : ""}`}>
        <div className="v2-cooler-top">
          <strong>DRINKS</strong>
          <span>Bay A · wall cooler</span>
        </div>
        <div className="v2-cooler-light" />
        <div className="v2-cooler-interior" data-bay-id={bay.id}>
          <div className="v2-facing-row" data-bay-id={bay.id}>
            {Array.from({ length: bay.capacity }, (_, index) => (
              <FacingCell key={index} facing={bay.facings[index] || null} index={index} faced={!!bay.faced} />
            ))}
          </div>
          <div className="v2-shelf-lip"><span>DRINKS · KEEP CHILLED</span></div>
        </div>
        <div className="v2-cooler-foot" />
      </div>

      <div className="v2-stock-cart v2-stock-cart--floor">
        <div className="v2-cart-handle" />
        <div className="v2-cart-label">YOUR CART <span>{state.cart.length} units</span></div>
        <div className="v2-cart-deck v2-cart-deck--draggable">
          {state.cart.length === 0 ? (
            <span className="v2-cart-empty">Cart empty</span>
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

      {full && !bay.faced ? (
        <div className="v2-face-action">
          <span>Products are stocked but still uneven.</span>
          <button className="v2-primary-button" type="button" onClick={onFace}>Face the row</button>
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

function CompletionOverlay({ score, onReset }) {
  return (
    <section className="v2-complete-card">
      <span className="v2-complete-check">✓</span>
      <h2>Drinks bay recovered</h2>
      <p>The row is full, faced and ready for customers.</p>
      <div className="v2-score-grid">
        <div><strong>{score.availability}%</strong><span>Availability</span></div>
        <div><strong>{score.accuracy}%</strong><span>Accuracy</span></div>
        <div><strong>{score.facing}%</strong><span>Facing</span></div>
      </div>
      <button className="v2-primary-button" type="button" onClick={onReset}>Replay shift</button>
    </section>
  );
}

export function SupermarketV2Game() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const shiftNumber = Math.max(1, Math.min(3, Number(params.get("shift") || 1)));
  const shift = SUPERMARKET_V2_VERTICAL_SLICE[shiftNumber - 1];
  const engineRef = useRef(null);
  const engineShiftRef = useRef(null);

  if (!engineRef.current || engineShiftRef.current !== shift.id) {
    engineRef.current = new ShiftEngine(shift);
    engineShiftRef.current = shift.id;
  }

  const [state, setState] = useState(() => engineRef.current.snapshot());
  const [message, setMessage] = useState("Read the priority card, then clock in.");
  const [drag, setDrag] = useState(null);
  const [score, setScore] = useState(null);

  const engine = engineRef.current;
  const scene = shift.scenes.find((entry) => entry.id === state.currentSceneId);
  const currentBay = Object.values(state.bays).find((bay) => bay.sceneId === state.currentSceneId) || null;

  function sync(nextMessage = null) {
    setState(engine.snapshot());
    if (nextMessage) setMessage(nextMessage);
  }

  function startShift() {
    const result = engine.startShift();
    sync(result.ok ? "Start in the backroom. Load the three priority cases." : REASON_COPY[result.reason]);
  }

  function loadCase(caseId) {
    const result = engine.loadCase(caseId);
    sync(result.ok ? "Case loaded onto the stock cart." : REASON_COPY[result.reason] || result.reason);
  }

  function moveToScene(sceneId) {
    const result = engine.moveToScene(sceneId);
    sync(result.ok ? "You are at the Drinks Wall. Drag stock into the visible gaps." : REASON_COPY[result.reason] || result.reason);
  }

  function beginDrag(event, unit) {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({
      unitId: unit.id,
      skuId: unit.skuId,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    });
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
      setMessage("Drop stock onto the visible shelf gaps.");
      return;
    }

    const result = engine.placeUnit(current.unitId, bayId);
    if (!result.ok) {
      sync(REASON_COPY[result.reason] || result.reason);
      return;
    }

    const bay = engine.state.bays[bayId];
    sync(result.bayFull ? "Row stocked. Now face the products forward." : `${visibleGapCount(bay)} gap${visibleGapCount(bay) === 1 ? "" : "s"} remain.`);
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
      sync("Shift complete. The bay is ready for customers.");
    } else {
      sync("Shelf faced. Continue the remaining priority work.");
    }
  }

  function resetShift() {
    engineRef.current = new ShiftEngine(shift);
    engineShiftRef.current = shift.id;
    setState(engineRef.current.snapshot());
    setMessage("Read the priority card, then clock in.");
    setDrag(null);
    setScore(null);
  }

  const activeEngine = engineRef.current;

  return (
    <main className="v2-game-shell">
      <ShiftHeader shift={shift} state={state} scene={scene} />

      {state.phase === "briefing" ? (
        <Briefing shift={shift} onStart={startShift} />
      ) : scene?.kind === "backroom" ? (
        <BackroomScene
          shift={shift}
          state={state}
          onLoadCase={loadCase}
          onLeave={() => moveToScene(shift.scenes.find((entry) => entry.kind === "department")?.id)}
        />
      ) : currentBay ? (
        <DrinksWallScene
          state={state}
          bay={currentBay}
          drag={drag}
          onDragStart={beginDrag}
          onDragMove={moveDrag}
          onDragEnd={endDrag}
          onFace={faceCurrentBay}
        />
      ) : (
        <section className="v2-empty-scene">This department scene is not built yet.</section>
      )}

      <div className="v2-message-bar" role="status">{message}</div>

      {score ? <CompletionOverlay score={score} onReset={resetShift} /> : null}

      <button
        className="v2-reset-link"
        type="button"
        onClick={() => {
          engineRef.current = activeEngine;
          resetShift();
        }}
      >
        Reset V2 shift
      </button>
    </main>
  );
}

export default SupermarketV2Game;
