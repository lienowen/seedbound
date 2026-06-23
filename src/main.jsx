import React from "react";
import { createRoot } from "react-dom/client";
import { FridgePhaserGame } from "./FridgePhaserGame.jsx";
import "./fridge-phaser.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FridgePhaserGame />
  </React.StrictMode>,
);
