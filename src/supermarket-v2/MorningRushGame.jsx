import { getSku, visibleGapCount } from "./model/storeModel.js";
import { useMorningRush } from "./runtime/useMorningRush.js";
import { ProductImage, RushCart, WallBay, locationName } from "./components/RushUi.jsx";
import "./supermarket-v2.css";
import "./supermarket-v2-multi.css";
import "./supermarket-v2-rush.css";

export function MorningRushGame() {
  const rush = useMorningRush();
  const {
    shift,
    state,
    scene,
    bay,
    nextScene,
    drag,
    score,
    message,
    customerEvent,
    dismissCustomerEvent,
    start,
    loadCase,
    moveTo,
    beginDrag,
    moveDrag,
    endDrag,
    faceCurrentBay,
    reset,
  } = rush;

  const required = state.tasks.filter((task) => !task.optional);
  const completed = required.filter((task) => task.complete).length;
  const allLoaded = state.cases.every((entry) => entry.loaded);
  const full = bay ? visibleGapCount(bay) === 0 : false;

  return (
    <main className="v2-game-shell">
      <header className="v2-shift-header">
        <div>
          <span className="v2-shift-kicker">Opening Rush</span>
          <strong>{shift.title}</strong>
        </div>
        <div className="v2-shift-header-right">
          <span className="v2-location-pill">{locationName(scene)}</span>
          <span className="v2-progress-pill">{completed}/{required.length}</span>
        </div>
      </header>

      {state.phase === "briefing" ? (
        <section className="v2-briefing-card">
          <div className="v2-briefing-eyebrow">08:00 · Opening rush</div>
          <h1>Morning Rush</h1>
          <p className="v2-role">Recover Dairy first, then Drinks.</p>
          <div className="v2-priority-sheet">
            <strong>Priority order</strong>
            <div className="v2-priority-row"><span className="v2-priority-dot" /><span>Dairy wall: 2 visible gaps</span></div>
            <div className="v2-priority-row"><span className="v2-priority-dot" /><span>Drinks wall: 2 visible gaps</span></div>
          </div>
          <p className="v2-briefing-note">The store is open. Customer activity can create new gaps while you work.</p>
          <button className="v2-primary-button" type="button" onClick={start}>Clock in</button>
        </section>
      ) : scene?.kind === "backroom" ? (
        <section className="v2-scene v2-backroom-scene">
          <div className="v2-backroom-wall" aria-hidden="true">
            <div className="v2-backroom-sign">BACKROOM · RUSH PICK</div>
            <div className="v2-backroom-rack-lines"><span /><span /><span /></div>
          </div>

          <div className="v2-scene-copy v2-scene-copy--left">
            <span>Rush pick</span>
            <h2>Load reserve stock</h2>
            <p>The Milk case includes one spare unit for live recovery.</p>
          </div>

          <div className="v2-case-rack">
            {state.cases.map((stockCase) => (
              <button
                className={`v2-case ${stockCase.loaded ? "is-loaded" : ""}`}
                key={stockCase.id}
                type="button"
                disabled={stockCase.loaded}
                onClick={() => loadCase(stockCase.id)}
              >
                <span className="v2-case-tape" />
                <ProductImage skuId={stockCase.skuId} className="v2-case-product" />
                <span className="v2-case-copy">
                  <strong>{getSku(stockCase.skuId)?.label}</strong>
                  <small>{stockCase.loaded ? "Loaded" : `${stockCase.quantity} units`}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="v2-scene-action">
            <span>{allLoaded ? "Cart ready" : "Load both priority cases"}</span>
            <button className="v2-primary-button" type="button" disabled={!allLoaded} onClick={() => moveTo("dairy-wall-rush")}>Push cart to Dairy wall</button>
          </div>
        </section>
      ) : bay ? (
        <section className="v2-scene v2-drinks-scene">
          <div className="v2-store-wall" aria-hidden="true"><div className="v2-store-wall-line" /></div>

          <div className="v2-scene-copy">
            <span>{locationName(scene)}</span>
            <h2>{state.activePriority ? "Urgent recovery" : "Recover the visible gaps"}</h2>
            <p>{state.activePriority || `${visibleGapCount(bay)} gap${visibleGapCount(bay) === 1 ? "" : "s"} remain.`}</p>
          </div>

          <WallBay bay={bay} />
          <RushCart state={state} drag={drag} beginDrag={beginDrag} moveDrag={moveDrag} endDrag={endDrag} />

          {full && !bay.faced ? (
            <div className="v2-face-action">
              <span>Stock is in. Pull products forward.</span>
              <button className="v2-primary-button" type="button" onClick={faceCurrentBay}>Face the shelf</button>
            </div>
          ) : null}

          {bay.faced && nextScene && nextScene.id !== scene.id && !state.activePriority ? (
            <div className="v2-department-next">
              <span>{String(bay.department).toUpperCase()} complete</span>
              <button className="v2-primary-button" type="button" onClick={() => moveTo(nextScene.id)}>Push cart to {locationName(nextScene)}</button>
            </div>
          ) : null}

          {drag ? (
            <div className="v2-drag-ghost" style={{ left: drag.clientX, top: drag.clientY }}>
              <ProductImage skuId={drag.skuId} />
            </div>
          ) : null}
        </section>
      ) : null}

      {customerEvent ? (
        <div className="v2-rush-event" role="alert">
          <strong>Customer activity</strong>
          <span>One Milk was just taken. Recover that gap before leaving Dairy.</span>
          <button type="button" onClick={dismissCustomerEvent}>Got it</button>
        </div>
      ) : null}

      <div className="v2-message-bar" role="status">{message}</div>

      {score ? (
        <section className="v2-complete-card">
          <span className="v2-complete-check">✓</span>
          <h2>Morning Rush complete</h2>
          <p>Both priority bays are recovered and faced.</p>
          <div className="v2-score-grid">
            <div><strong>{score.availability}%</strong><span>Availability</span></div>
            <div><strong>{score.accuracy}%</strong><span>Accuracy</span></div>
            <div><strong>{score.facing}%</strong><span>Facing</span></div>
          </div>
          <button className="v2-primary-button" type="button" onClick={reset}>Replay shift</button>
        </section>
      ) : null}

      <button className="v2-reset-link" type="button" onClick={reset}>Reset V2 shift</button>
    </main>
  );
}

export default MorningRushGame;
