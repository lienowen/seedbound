import { useMemo, useRef, useState } from "react";
import { assetUrl } from "../assetBase.js";
import { SUPERMARKET_V2_VERTICAL_SLICE } from "./data/verticalSlice.js";
import { ShiftEngine } from "./model/shiftEngine.js";
import { StockBox } from "./StockBox.jsx";
import {
  maxShiftNumber,
  readShiftProgress,
  replaceShiftInUrl,
  resolveInitialShift,
  saveShiftArrival,
  saveShiftCompletion,
} from "./model/shiftProgress.js";
import {
  FIXTURE_KIND,
  getSku,
  occupiedCellSet,
  planogramAllowsSkuAtCell,
  visibleGapCount,
} from "./model/storeModel.js";
import "./replenishment-shift.css";

const ERROR_COPY = {
  "wrong-department-or-fixture": "Wrong department. This product belongs somewhere else.",
  "wrong-planogram-facing": "Wrong facing. Match the product to the shelf label and neighboring SKU.",
  "wrong-scene": "You are not standing at that fixture.",
};

// ... existing code remains unchanged

function Backroom({ state, nextScene, onLoadCase, onLeave }) {
  const unloaded = state.cases.filter((stockCase) => !stockCase.loaded);
  return (
    <section className="sv2-stage sv2-backroom">
      <div className="sv2-wall-sign">BACKROOM · MORNING RECEIVING</div>
      <div className="sv2-stage-title">
        <span>Step 1</span>
        <h2>Load only the priority stock</h2>
        <p>Pick cartons from the receiving area and load the replenishment cart.</p>
      </div>

      <div className="sv2-backroom-rack">
        {state.cases.map((stockCase) => (
          <StockBox
            key={stockCase.id}
            skuId={stockCase.skuId}
            quantity={stockCase.quantity}
            loaded={stockCase.loaded}
            onPick={() => onLoadCase(stockCase.id)}
          />
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
