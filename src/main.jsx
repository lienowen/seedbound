import React from "react";
import { createRoot } from "react-dom/client";
import { FridgePhaserGame } from "./FridgePhaserGame.jsx";
import { redirectToLocaleIfNeeded } from "./i18n/locale.js";
import "./fridge-phaser.css";

redirectToLocaleIfNeeded();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FridgePhaserGame />
  </React.StrictMode>,
);
