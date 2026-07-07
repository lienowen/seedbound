import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { redirectToLocaleIfNeeded } from "./i18n/locale.js";
import "./fridge-phaser.css";
import "./supermarket-v2/replenishment-planogram.css";

const params = new URLSearchParams(window.location.search);
const useSupermarketV2 = params.get("v2") === "true" || params.get("mode") === "supermarket-v2";

const LegacyGame = lazy(() =>
  import("./legacyAppBootstrap.js")
    .then(({ loadLegacyGame }) => loadLegacyGame())
    .then((gameModule) => ({ default: gameModule.FridgePhaserGame })),
);

const SupermarketV2Game = lazy(() =>
  import("./supermarket-v2/SupermarketV2Entry.jsx")
    .then((module) => ({ default: module.SupermarketV2Entry })),
);

function BootFallback({ v2 }) {
  if (v2) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg,#eee7dc,#d4bd99)", color: "#4b4035", fontFamily: "Trebuchet MS, Segoe UI, sans-serif" }}>
        <section style={{ textAlign: "center", padding: 24 }}>
          <strong style={{ display: "block", fontSize: 28 }}>Morning shift</strong>
          <span style={{ display: "block", marginTop: 6, opacity: 0.7 }}>Opening the backroom...</span>
        </section>
      </main>
    );
  }

  return (
    <main className="fridge-shell fridge-boot-shell">
      <section className="fridge-boot-card fridge-boot-card--transition" aria-live="polite">
        <div className="fridge-boot-badge">Cozy Shelf</div>
        <div className="fridge-boot-portal" aria-hidden="true">
          <div className="fridge-boot-portal__glow" />
          <div className="fridge-boot-portal__frame">
            <div className="fridge-boot-portal__shelves"><span /><span /><span /></div>
            <div className="fridge-boot-portal__door"><span /><span /><span /></div>
            <div className="fridge-boot-portal__items"><i /><i /><i /><i /></div>
          </div>
        </div>
        <h1>Cozy Shelf</h1>
        <p>Opening up the shop...</p>
      </section>
    </main>
  );
}

redirectToLocaleIfNeeded();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={<BootFallback v2={useSupermarketV2} />}>
      {useSupermarketV2 ? <SupermarketV2Game /> : <LegacyGame />}
    </Suspense>
  </React.StrictMode>,
);
