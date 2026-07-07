import { applyCoreConsistencyPatches } from "./runtime/coreConsistencyBootstrap.js";
import { applySupermarketRestockProgressionPolish } from "./runtime/supermarketRestockProgressionPolish.js";
import { applySupermarketRestockNudgePolish } from "./runtime/supermarketRestockNudgePolish.js";
import { applySupermarketRestockVisualPolish } from "./runtime/supermarketRestockVisualPolish.js";
import { applySupermarketRestockSpacingPolish } from "./runtime/supermarketRestockSpacingPolish.js";
import { applyPreviewConstraintPolish } from "./runtime/previewConstraintPolish.js";

export async function loadLegacyGame() {
  applyCoreConsistencyPatches();
  applySupermarketRestockProgressionPolish();
  applySupermarketRestockNudgePolish();
  applySupermarketRestockVisualPolish();
  applySupermarketRestockSpacingPolish();
  applyPreviewConstraintPolish();

  const [dragPolish, restockPolish, facingPolish, gameModule] = await Promise.all([
    import("./runtime/dragSnapPolish.js"),
    import("./runtime/supermarketRestockScenePolish.js"),
    import("./runtime/supermarketRestockFacingPolish.js"),
    import("./FridgePhaserGame.jsx"),
  ]);

  dragPolish.applyDragSnapPolish();
  restockPolish.applySupermarketRestockScenePolish();
  facingPolish.applySupermarketRestockFacingPolish();
  return gameModule;
}
