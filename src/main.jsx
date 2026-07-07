import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { redirectToLocaleIfNeeded } from "./i18n/locale.js";
import { applyCoreConsistencyPatches } from "./runtime/coreConsistencyBootstrap.js";
import { applySupermarketRestockProgressionPolish } from "./runtime/supermarketRestockProgressionPolish.js";
import { applySupermarketRestockVisualPolish } from "./runtime/supermarketRestockVisualPolish.js";
import { applyPreviewConstraintPolish } from "./runtime/previewConstraintPolish.js";
import "./fridge-phaser.css";

// Apply the supermarket-restock data model before campaign progress is read.
// Old door-capacity and cold-door compatibility patches are intentionally gone:
// commercial cooler levels now use category-labelled shelf facings as the single
// source of truth.
applyCoreConsistencyPatches();
applySupermarketRestockProgressionPolish();
applySupermarketRestockVisualPolish();
applyPreviewConstraintPolish();

// Keep Phaser and scene-level polish out of the initial UI bundle.
const fridgePhaserGameImport = Promise.all([
  import("./runtime/dragSnapPolish.js"),
  import("./runtime/supermarketRestockScenePolish.js"),
  import("./FridgePhaserGame.jsx"),
]).then(([dragPolish, restockPolish, gameModule]) => {
  dragPolish.applyDragSnapPolish();
  restockPolish.applySupermarketRestockScenePolish();
  return gameModule;
});

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
