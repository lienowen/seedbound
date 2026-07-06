import { StorageScene } from "../game/StorageScene.js";
import { StorageEngine } from "../game/StorageEngine.js";

let applied = false;

const EVENTS = {
  "fridge-br-11": { waves: [{ after: 2, count: 2, label: "Late delivery! Two more items arrived." }] },
  "fridge-br-12": { pickupAfter: 3, pickupLabel: "Customer pickup! One item is needed again." },
  "fridge-br-13": { waves: [{ after: 2, count: 2, label: "BBQ restock! More bottles just arrived." }] },
  "fridge-br-14": { waves: [{ after: 2, count: 3, label: "Second shopping bag arrived!" }] },
  "fridge-br-15": { pickupAfter: 3, pickupLabel: "Chef request! Re-stock one item." },
  "fridge-br-16": { waves: [{ after: 2, count: 2, label: "Party guests brought more drinks!" }] },
  "fridge-br-17": { pickupAfter: 2, pickupLabel: "Midnight snack! Put one item back." },
  "fridge-br-18": { waves: [{ after: 2, count: 2, label: "Rush delivery! New stock is here." }], pickupAfter: 4, pickupLabel: "Customer rush! One item was taken." },
  "fridge-br-19": { pickupAfter: 3, pickupLabel: "New Year order! Refill the missing item." },
  "fridge-br-20": { waves: [{ after: 2, count: 2, label: "FINAL ROUND: last delivery arrived!" }], pickupAfter: 4, pickupLabel: "FINAL TWIST: a customer took one item!" },
};

function movableIds(scene) {
  return scene.level.items.filter((item) => !item.fixed).map((item) => item.id);
}

function packedMovableCount(scene) {
  return movableIds(scene).filter((id) => scene.engine.state.items[id]?.status === "packed").length;
}

function setEventHidden(scene, id, hidden) {
  const def = scene.engine.itemDef(id);
  if (def) def.eventHidden = hidden;
}

function eventStorageKey(scene) {
  return `cozyshelf.mid-event.${scene.level.id}.v1`;
}

function readEventSave(scene) {
  try {
    return JSON.parse(localStorage.getItem(eventStorageKey(scene)) || "{}") || {};
  } catch {
    return {};
  }
}

function writeEventSave(scene, value) {
  try {
    localStorage.setItem(eventStorageKey(scene), JSON.stringify(value));
  } catch {
    // Event persistence must never interrupt play.
  }
}

function revealWave(scene, wave, animate = true) {
  if (wave.revealed) return;
  wave.revealed = true;
  for (const id of wave.ids) {
    setEventHidden(scene, id, false);
    const sprite = scene.sprites.get(id);
    if (!sprite) continue;
    const baseScale = scene.displayScaleFor(sprite.getData("item"), sprite.getData("home"));
    sprite.setActive(true).setVisible(true).setAlpha(animate ? 0 : 1).setScale(animate ? baseScale * 0.82 : baseScale);
    sprite.setInteractive({ draggable: true, pixelPerfect: false });
    scene.input.setDraggable(sprite);
    if (animate) {
      scene.tweens.add({
        targets: sprite,
        alpha: 1,
        scaleX: baseScale,
        scaleY: baseScale,
        duration: 260,
        ease: "Back.out(1.8)",
      });
    }
  }
  if (animate) {
    scene.playCallout("NEW STOCK!", "gold");
    scene.setToastMessage(wave.label);
  }
}

function prepareWaves(scene, spec) {
  const ids = movableIds(scene);
  const packed = packedMovableCount(scene);
  let cursor = ids.length;
  const waves = [];

  for (const config of [...(spec.waves || [])].reverse()) {
    const start = Math.max(0, cursor - config.count);
    const group = ids.slice(start, cursor);
    cursor = start;
    waves.unshift({ ...config, ids: group, revealed: false });
  }

  for (const wave of waves) {
    const restoredProgress = packed >= wave.after || wave.ids.some((id) => scene.engine.state.items[id]?.status === "packed");
    if (restoredProgress) {
      revealWave(scene, wave, false);
      continue;
    }
    for (const id of wave.ids) {
      setEventHidden(scene, id, true);
      const sprite = scene.sprites.get(id);
      if (sprite) sprite.disableInteractive().setVisible(false).setActive(false);
    }
  }
  return waves;
}

function triggerPickup(scene, state) {
  if (state.pickupDone || !state.spec.pickupAfter) return;
  if (packedMovableCount(scene) < state.spec.pickupAfter) return;
  if (scene.engine.validate().complete) return;

  const candidates = movableIds(scene)
    .filter((id) => scene.engine.state.items[id]?.status === "packed")
    .filter((id) => id !== state.lastPlacedId);
  const id = candidates[0];
  if (!id) return;

  state.pickupDone = true;
  writeEventSave(scene, { pickupDone: true });
  scene.time.delayedCall(420, () => {
    if (!scene.scene.isActive() || scene.engine.validate().complete) return;
    const sprite = scene.sprites.get(id);
    if (sprite) scene.tweens.killTweensOf(sprite);
    scene.engine.moveOutside(id);
    scene.playCallout("CUSTOMER PICKUP!", "ice");
    scene.setToastMessage(state.spec.pickupLabel);
  });
}

export function applyMidCampaignEventPolish() {
  if (applied) return;
  applied = true;

  const originalMovableItems = StorageEngine.prototype.movableItems;
  StorageEngine.prototype.movableItems = function visibleMovableItems() {
    return originalMovableItems.call(this).filter((item) => !item.eventHidden);
  };

  const originalCreate = StorageScene.prototype.create;
  const originalDragEnd = StorageScene.prototype.onDragEnd;

  StorageScene.prototype.create = function createWithMidEvents(data) {
    const payload = { ...this.entryData, ...data };
    const result = originalCreate.call(this, data);
    const spec = EVENTS[this.level?.id];
    if (!spec || this.editMode) return result;

    if (payload.forceFresh) {
      try { localStorage.removeItem(eventStorageKey(this)); } catch { /* no-op */ }
    }
    const saved = readEventSave(this);
    this.midEventState = {
      spec,
      waves: prepareWaves(this, spec),
      pickupDone: !!saved.pickupDone,
      lastPlacedId: null,
    };
    this.time.delayedCall(900, () => this.setToastMessage("Dynamic shift: expect surprises."));
    return result;
  };

  StorageScene.prototype.onDragEnd = function dragEndWithMidEvents(obj) {
    const item = obj?.getData?.("item");
    const before = item ? this.engine.state.items[item.id]?.status : null;
    const result = originalDragEnd.call(this, obj);
    const state = this.midEventState;
    if (!state || !item) return result;

    const placedNow = before !== "packed" && this.engine.state.items[item.id]?.status === "packed";
    if (!placedNow) return result;
    state.lastPlacedId = item.id;

    const packed = packedMovableCount(this);
    for (const wave of state.waves) {
      if (!wave.revealed && packed >= wave.after) revealWave(this, wave, true);
    }
    triggerPickup(this, state);
    return result;
  };
}
