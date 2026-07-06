import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { redirectToLocaleIfNeeded } from "./i18n/locale.js";
import { applyCoreConsistencyPatches } from "./runtime/coreConsistencyBootstrap.js";
import { applyEngineConsistency } from "./runtime/engineConsistency.js";
import { applyPreviewConstraintPolish } from "./runtime/previewConstraintPolish.js";
import { applyDragSnapPolish } from "./runtime/dragSnapPolish.js";
import "./fridge-phaser.css";

// Apply campaign/data consistency before the game module reads progress.
applyCoreConsistencyPatches();
applyEngineConsistency();
applyPreviewConstraintPolish();
applyDragSnapPolish();

const fridgePhaserGameImport = import("./FridgePhaserGame.jsx");
const FridgePhaserGame = lazy(() =>
  fridgePhaserGameImport.then((module) => ({ default: module.FridgePhaserGame })),
);

redirectToLocaleIfNeeded();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense
      fallback={(
        <main className="fridge-shell fridge-boot-shell">
          <section className="fridge-boot-card fridge-boot-card--transition" aria-live="polite">
            <div className="fridge-boot-badge">Cozy Shelf</div>
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
            <h1>Cozy Shelf</h1>
            <p>Opening up the shop...</p>
          </section>
        </main>
      )}
    >
      <FridgePhaserGame />
    </Suspense>
  </React.StrictMode>,
);
