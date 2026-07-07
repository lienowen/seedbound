import { useMemo, useRef, useState } from "react";
import { assetUrl } from "../assetBase.js";
import { SUPERMARKET_V2_VERTICAL_SLICE } from "./data/verticalSlice.js";
import { ShiftEngine } from "./model/shiftEngine.js";
import { FIXTURE_KIND, getSku, occupiedCellSet, visibleGapCount } from "./model/storeModel.js";
import "./replenishment-shift.css";

const ERROR_COPY = {
  "wrong-department-or-fixture": "Wrong department. This product belongs somewhere else.",
  "wrong-scene": "You are not standing at that fixture.",
  "no-shelf-capacity": "Shelf full. Extra stock must go back to backstock.",
  "no-contiguous-shelf-gap": "That product does not fit this gap.",
  "unit-not-on-cart": "That unit is no longer on your cart.",
  "required-work-incomplete": "Finish the priority work before clocking out.",
};

function productUrl(skuId) {
  return assetUrl(`tidy/${skuId}.png`);
}

function ProductArt({ skuId, className = "" }) {
  const [failed, setFailed] = useState(false);
  const sku = getSku(skuId);
  if (failed) {
    return <span className={`sv2-product-fallback ${className}`}>{(sku?.label || skuId).slice(0, 2).toUpperCase()}</span>;
  }
  return (
    <img
      className={className}
      src={productUrl(skuId)}
      alt={sku?.label || skuId}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

function sceneLabel(scene) {
  if (!scene) return "Store";
  if (scene.kind === "backroom") return "Backroom";
  if (scene.department === "breakfast") return "Breakfast aisle";
  if (scene.department === "dairy") return "Dairy wall";
  if (scene.department === "drinks") return "Drinks wall";
  return scene.department || "Shop floor";
}

function nextWorkSceneId(state) {
  for (const task of state.tasks) {
    if (task.complete || task.optional || !task.bayId) continue;
    const bay = state.bays[task.bayId];
    if (bay?.sceneId) return bay.sceneId;
  }
  return null;
}

function requiredTaskProgress(state) {
  const required = state.tasks.filter((task) => !task.optional);
  return {
    done: required.filter((task) => task.complete).length,
    total: required.length,
  };
}

function ShiftBriefing({ shift, onStart }) {
  return (
    <section className="sv2-briefing">
      <span className="sv2-eyebrow">{shift.briefing.clock} · Staff entrance</span>
      <h1>{shift.title}</h1>
      <p className="sv2-role">{shift.briefing.role}</p>
      <div className="sv2-priority-card">
        <strong>Priority list</strong>
        {shift.briefing.priorities.map((priority, index) => (
          <div className="sv2-priority-line" key={priority}>
            <span>{index + 1}</span>
            <p>{priority}</p>
          </div>
        ))}
      </div>
      <p className="sv2-briefing-copy">Collect the priority stock in the backroom, push the cart to the correct department, recover visible gaps, then face the bay before leaving.</p>
      <button className="sv2-primary" type="button" onClick={onStart}>Clock in</button>
    </section>
  );
}

function ShiftHeader({ shift, state, scene }) {
  const progress = requiredTaskProgress(state);
  return (
    <header className="sv2-header">
      <div>
        <span>{shift.briefing.role}</span>
        <strong>{shift.title}</strong>
      </div>
      <div className="sv2-header-status">
        <span>{sceneLabel(scene)}</span>
        <b>{progress.done}/{progress.total}</b>
      </div>
    </header>
  );
}

function Backroom({ state, nextScene, onLoadCase, onLeave }) {
  const unloaded = state.cases.filter((stockCase) => !stockCase.loaded);
  return (
    <section className="sv2-stage sv2-backroom">
      <div className="sv2-wall-sign">BACKROOM · MORNING RECEIVING</div>
      <div className="sv2-stage-title">
        <span>Step 1</span>
        <h2>Load only the priority stock</h2>
        <p>Tap the labelled cases to place their units on your replenishment cart.</p>
      </div>

      <div className="sv2-backroom-rack">
        {state.cases.map((stockCase) => (
          <button
            type="button"
            className={`sv2-case ${stockCase.loaded ? "is-loaded" : ""}`}
            key={stockCase.id}
            disabled={stockCase.loaded}
            onClick={() => onLoadCase(stockCase.id)}
          >
            <span className="sv2-case-tape" />
            <ProductArt skuId={stockCase.skuId} className="sv2-case-art" />
            <strong>{getSku(stockCase.skuId)?.label}</strong>
            <small>{stockCase.loaded ? "ON CART" : `${stockCase.quantity} priority unit${stockCase.quantity === 1 ? "" : "s"}`}</small>
          </button>
        ))}
      </div>

      <Cart state={state} compact />

      <div className="sv2-stage-action">
        <span>{unloaded.length ? `${unloaded.length} priority case${unloaded.length === 1 ? "" : "s"} still on rack` : "Cart ready"}</span>
        <button className="sv2-primary" type="button" disabled={unloaded.length > 0 || !nextScene} onClick={onLeave}>
          Push cart to {sceneLabel(nextScene)}
        </button>
      </div>
    </section>
  );
}

function Cart({ state, compact = false, selectedUnitId, onSelectUnit, onDragStart }) {
  return (
    <aside className={`sv2-cart ${compact ? "is-compact" : ""}`}>
      <div className="sv2-cart-handle" />
      <div className="sv2-cart-title">REPLENISHMENT CART <span>{state.cart.length} units</span></div>
      <div className="sv2-cart-deck">
        {state.cart.length === 0 ? <p>Cart empty</p> : state.cart.map((unit) => (
          compact ? (
            <div className="sv2-cart-mini" key={unit.id}><ProductArt skuId={unit.skuId} /></div>
          ) : (
            <button
              type="button"
              className={`sv2-cart-unit ${selectedUnitId === unit.id ? "is-selected" : ""}`}
              key={unit.id}
              draggable
              onClick={() => onSelectUnit(unit.id)}
              onDragStart={(event) => onDragStart(event, unit.id)}
            >
              <ProductArt skuId={unit.skuId} />
              <small>{getSku(unit.skuId)?.label}</small>
            </button>
          )
        ))}
      </div>
      <i className="sv2-wheel sv2-wheel-a" />
      <i className="sv2-wheel sv2-wheel-b" />
    </aside>
  );
}

function FacingCell({ facing, bay }) {
  const footprint = Math.max(1, Number(facing.footprint || 1));
  const cell = Math.max(0, Number(facing.cell || 0));
  return (
    <div
      className={`sv2-facing-product ${bay.faced ? "is-faced" : "is-unfaced"}`}
      style={{ gridColumn: `${cell + 1} / span ${footprint}` }}
    >
      <ProductArt skuId={facing.skuId} />
    </div>
  );
}

function ShelfCells({ bay, selectedUnitId, onPlaceAtCell, onDropUnit }) {
  const occupied = occupiedCellSet(bay);
  const covered = new Set();
  for (const facing of bay.facings) {
    const start = Math.max(0, Number(facing.cell || 0));
    const footprint = Math.max(1, Number(facing.footprint || 1));
    for (let offset = 0; offset < footprint; offset += 1) covered.add(start + offset);
  }

  return (
    <div className="sv2-facing-grid" style={{ gridTemplateColumns: `repeat(${bay.capacity}, minmax(0, 1fr))` }}>
      {Array.from({ length: bay.capacity }, (_, cell) => {
        if (occupied.has(cell) || covered.has(cell)) return null;
        return (
          <button
            type="button"
            className={`sv2-gap ${selectedUnitId ? "is-ready" : ""}`}
            key={`gap-${cell}`}
            style={{ gridColumn: `${cell + 1}` }}
            onClick={() => onPlaceAtCell(cell)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onDropUnit(event.dataTransfer.getData("text/plain"), cell);
            }}
          >
            <span />
            <small>GAP</small>
          </button>
        );
      })}
      {bay.facings.map((facing) => <FacingCell key={facing.unitId} facing={facing} bay={bay} />)}
    </div>
  );
}

function Fixture({ bay, selectedUnitId, onPlaceAtCell, onDropUnit }) {
  const dry = bay.kind === FIXTURE_KIND.DRY_SHELF;
  return (
    <div className={dry ? "sv2-dry-fixture" : "sv2-wall-cooler"}>
      <div className="sv2-fixture-header">
        <strong>{String(bay.department).toUpperCase()}</strong>
        <span>{dry ? "Ambient aisle bay" : "Perimeter wall cooler"}</span>
      </div>
      <div className="sv2-fixture-interior">
        <ShelfCells
          bay={bay}
          selectedUnitId={selectedUnitId}
          onPlaceAtCell={onPlaceAtCell}
          onDropUnit={onDropUnit}
        />
        <div className="sv2-price-rail">{String(bay.department).toUpperCase()} · {visibleGapCount(bay)} GAP{visibleGapCount(bay) === 1 ? "" : "S"}</div>
      </div>
      <div className="sv2-fixture-base" />
    </div>
  );
}

function Department({ scene, state, bay, nextScene, selectedUnitId, onSelectUnit, onDragStart, onPlaceAtCell, onDropUnit, onFace, onNext }) {
  const gaps = visibleGapCount(bay);
  const full = gaps === 0;
  return (
    <section className={`sv2-stage sv2-department sv2-department-${scene.department}`}>
      <div className="sv2-perimeter-wall" aria-hidden="true"><span /></div>
      <div className="sv2-stage-title">
        <span>{sceneLabel(scene)}</span>
        <h2>{full ? "Finish the bay" : "Recover the visible gaps"}</h2>
        <p>{full ? (bay.faced ? "Bay recovered and faced. Move to the next priority." : "Stock is in. Pull products forward and straighten the facing.") : `${gaps} visible gap${gaps === 1 ? "" : "s"} remain.`}</p>
      </div>

      <Fixture
        bay={bay}
        selectedUnitId={selectedUnitId}
        onPlaceAtCell={onPlaceAtCell}
        onDropUnit={onDropUnit}
      />

      <Cart
        state={state}
        selectedUnitId={selectedUnitId}
        onSelectUnit={onSelectUnit}
        onDragStart={onDragStart}
      />

      <div className="sv2-stage-action">
        {!full ? (
          <span>{selectedUnitId ? "Product selected — tap a highlighted gap or drag it onto the shelf." : "Select a cart unit, then choose a real shelf gap."}</span>
        ) : !bay.faced ? (
          <>
            <span>Stocked, but the products are still uneven.</span>
            <button className="sv2-primary" type="button" onClick={onFace}>Face products forward</button>
          </>
        ) : nextScene ? (
          <>
            <span>{String(bay.department).toUpperCase()} complete</span>
            <button className="sv2-primary" type="button" onClick={onNext}>Push cart to {sceneLabel(nextScene)}</button>
          </>
        ) : (
          <span>Priority bay complete</span>
        )}
      </div>
    </section>
  );
}

function CompleteCard({ shift, score, onReplay }) {
  return (
    <section className="sv2-complete">
      <span className="sv2-complete-check">✓</span>
      <h2>{shift.title} complete</h2>
      <p>The priority bays are recovered, faced and ready for customers.</p>
      <div className="sv2-score-row">
        <div><strong>{score.availability}%</strong><span>Availability</span></div>
        <div><strong>{score.accuracy}%</strong><span>Accuracy</span></div>
        <div><strong>{score.facing}%</strong><span>Facing</span></div>
      </div>
      <button className="sv2-primary" type="button" onClick={onReplay}>Replay shift</button>
    </section>
  );
}

export function ReplenishmentShiftGame() {
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
  const [message, setMessage] = useState("Read the priority list, then clock in.");
  const [selectedUnitId, setSelectedUnitId] = useState(null);
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
    sync(result.ok ? "Start in the backroom. Load the priority stock." : ERROR_COPY[result.reason] || result.reason);
  }

  function loadCase(caseId) {
    const result = engine.loadCase(caseId);
    sync(result.ok ? "Priority stock loaded onto the replenishment cart." : ERROR_COPY[result.reason] || result.reason);
  }

  function moveToScene(sceneId) {
    if (!sceneId) return;
    const result = engine.moveToScene(sceneId);
    const target = shift.scenes.find((entry) => entry.id === sceneId);
    setSelectedUnitId(null);
    sync(result.ok ? `Arrived at ${sceneLabel(target)}. Recover the visible gaps.` : ERROR_COPY[result.reason] || result.reason);
  }

  function selectUnit(unitId) {
    setSelectedUnitId((current) => current === unitId ? null : unitId);
  }

  function dragStart(event, unitId) {
    event.dataTransfer.setData("text/plain", unitId);
    event.dataTransfer.effectAllowed = "move";
    setSelectedUnitId(unitId);
  }

  function placeUnitAtCell(unitId, cell) {
    if (!unitId || !currentBay) {
      setMessage("Select a product from your cart first.");
      return;
    }
    const result = engine.placeUnit(unitId, currentBay.id, cell);
    if (!result.ok) {
      sync(ERROR_COPY[result.reason] || result.reason);
      return;
    }
    setSelectedUnitId(null);
    const bay = engine.state.bays[currentBay.id];
    const gaps = visibleGapCount(bay);
    sync(result.bayFull ? "Bay stocked. Face the products before leaving." : `${gaps} visible gap${gaps === 1 ? "" : "s"} remain.`);
  }

  function faceBay() {
    if (!currentBay) return;
    const result = engine.faceBay(currentBay.id);
    if (!result.ok) {
      sync(ERROR_COPY[result.reason] || result.reason);
      return;
    }
    const finish = engine.finishShift();
    if (finish.ok) {
      setScore(finish.score);
      sync("Shift complete. Priority bays are ready for customers.");
      return;
    }
    const upcomingId = nextWorkSceneId(engine.snapshot());
    const upcoming = shift.scenes.find((entry) => entry.id === upcomingId);
    sync(upcoming ? `Bay faced. Next priority: ${sceneLabel(upcoming)}.` : "Bay faced. Continue the priority list.");
  }

  function replay() {
    engineRef.current = new ShiftEngine(shift);
    shiftIdRef.current = shift.id;
    setState(engineRef.current.snapshot());
    setMessage("Read the priority list, then clock in.");
    setSelectedUnitId(null);
    setScore(null);
  }

  return (
    <main className="sv2-shell">
      <ShiftHeader shift={shift} state={state} scene={scene} />
      {state.phase === "briefing" ? (
        <ShiftBriefing shift={shift} onStart={startShift} />
      ) : scene?.kind === "backroom" ? (
        <Backroom
          state={state}
          nextScene={nextScene}
          onLoadCase={loadCase}
          onLeave={() => moveToScene(nextScene?.id)}
        />
      ) : currentBay ? (
        <Department
          scene={scene}
          state={state}
          bay={currentBay}
          nextScene={nextScene?.id === scene?.id ? null : nextScene}
          selectedUnitId={selectedUnitId}
          onSelectUnit={selectUnit}
          onDragStart={dragStart}
          onPlaceAtCell={(cell) => placeUnitAtCell(selectedUnitId, cell)}
          onDropUnit={placeUnitAtCell}
          onFace={faceBay}
          onNext={() => moveToScene(nextScene?.id)}
        />
      ) : (
        <section className="sv2-stage sv2-missing-scene">No playable fixture is bound to this department.</section>
      )}

      <div className="sv2-message" role="status">{message}</div>
      {score ? <CompleteCard shift={shift} score={score} onReplay={replay} /> : null}
      <button className="sv2-reset" type="button" onClick={replay}>Reset shift</button>
    </main>
  );
}

export default ReplenishmentShiftGame;
