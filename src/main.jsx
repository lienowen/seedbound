import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { redirectToLocaleIfNeeded } from "./i18n/locale.js";
import "./fridge-phaser.css";

const FridgePhaserGame = lazy(() =>
  import("./FridgePhaserGame.jsx").then((module) => ({ default: module.FridgePhaserGame })),
);

redirectToLocaleIfNeeded();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense
      fallback={(
        <main className="fridge-shell fridge-boot-shell">
          <section className="fridge-boot-card" aria-live="polite">
            <div className="fridge-boot-badge">Seedbound</div>
            <h1>Loading fridge...</h1>
            <p>Preparing shelves, bottles, and the first cozy level.</p>
          </section>
        </main>
      )}
    >
      <FridgePhaserGame />
    </Suspense>
  </React.StrictMode>,
);
