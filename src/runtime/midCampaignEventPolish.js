import { StorageScene } from "../game/StorageScene.js";

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

function revealWave(scene, wave) {
  if (wave.revealed) return;
  wave.revealed = true;
  for (const id of wave.ids) {
    const sprite = scene.sprites.get(id);
    if (!sprite) continue;
    sprite.setActive(true).setVisible(true).setAlpha(0).setScale(sprite.scaleX * 0.82);
    sprite.setInteractive({ draggable: true, pixelPerfect: false });
    scene.input.setDraggable(sprite);
    scene.tweens.add({
      targets: sprite,
      alpha: 1,
      scaleX: sprite.scaleX / 0.82,
      scaleY: sprite.scaleY / 0.82,
      duration: 260,
      ease: "Back.out(1.8)",
    });
  }
  scene.playCallout("NEW STOCK!", "gold");
  scene.setToastMessage(wave.label);
}

function hideLaterWaves(scene, spec) {
  const ids = movableIds(scene);
  let cursor = ids.length;
  const waves = [];
  for (const config of [...(spec.waves || [])].reverse()) {
    const start = Math.max(0, cursor - config.count);
    const group = ids.slice(start, cursor);
    cursor = start;
    waves.unshift({ ...config, ids: group, revealed: false });
  }
  for (const wave of waves) {
    for (const id of wave.ids) {
      const sprite = scene.sprites.get(id);
      if (!sprite) continue;
      sprite.disableInteractive().setVisible(false).setActive(false);
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

  const originalCreate = StorageScene.prototype.create;
  const originalDragEnd = StorageScene.prototype.onDragEnd;

  StorageScene.prototype.create = function createWithMidEvents(data) {
    const result = originalCreate.call(this, data);
    const spec = EVENTS[this.level?.id];
    if (!spec || this.editMode) return result;
    this.midEventState = { spec, waves: hideLaterWaves(this, spec), pickupDone: false, lastPlacedId: null };
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
      if (!wave.revealed && packed >= wave.after) revealWave(this, wave);
    }
    triggerPickup(this, state);
    return result;
  };
}
