import { StorageScene } from "../game/StorageScene.js";
import { StorageEngine } from "../game/StorageEngine.js";

let applied = false;

const EVENTS = {
  "fridge-br-11": { wrongDelivery: true, waves: [{ after: 2, count: 2 }] },
  "fridge-br-12": { pickupAfter: 3 },
  "fridge-br-13": { waves: [{ after: 2, count: 2 }] },
  "fridge-br-14": { waves: [{ after: 2, count: 3 }] },
  "fridge-br-15": { wrongDelivery: true, pickupAfter: 3 },
  "fridge-br-16": { waves: [{ after: 2, count: 2 }] },
  "fridge-br-17": { pickupAfter: 2 },
  "fridge-br-18": { waves: [{ after: 2, count: 2 }], pickupAfter: 4 },
  "fridge-br-19": { pickupAfter: 3 },
  "fridge-br-20": { waves: [{ after: 2, count: 2 }], pickupAfter: 4 },
};

const COPY = {
  en: {
    wrongItemName: "Wrong Delivery",
    wrongCallout: "WRONG DELIVERY!",
    returnedCallout: "RETURNED!",
    returnedToast: "Wrong delivery returned! +10 coins",
    newStockCallout: "NEW STOCK!",
    pickupCallout: "CUSTOMER PICKUP!",
    dynamicShift: "Dynamic shift: expect surprises.",
    waveDefault: "New stock arrived!",
    pickupDefault: "A customer changed the plan. Restore the missing item.",
    wrongDefault: "Wrong delivery! Drag the red-tagged item away.",
    levels: {
      "fridge-br-11": { wrongLabel: "Wrong delivery! Drag the red-tagged item away.", waves: ["Late delivery! Two more items arrived."] },
      "fridge-br-12": { pickupLabel: "Customer pickup! One item is needed again." },
      "fridge-br-13": { waves: ["BBQ restock! More bottles just arrived."] },
      "fridge-br-14": { waves: ["Second shopping bag arrived!"] },
      "fridge-br-15": { wrongLabel: "Supplier mistake! Return the red-tagged item.", pickupLabel: "Chef request! Re-stock one item." },
      "fridge-br-16": { waves: ["Party guests brought more drinks!"] },
      "fridge-br-17": { pickupLabel: "Midnight snack! Put one item back." },
      "fridge-br-18": { waves: ["Rush delivery! New stock is here."], pickupLabel: "Customer rush! One item was taken." },
      "fridge-br-19": { pickupLabel: "Festival order! Refill the missing item." },
      "fridge-br-20": { waves: ["Last delivery arrived!"], pickupLabel: "One final customer pickup changed the plan!" },
    },
  },
  cn: {
    wrongItemName: "错送商品",
    wrongCallout: "发现错货！",
    returnedCallout: "已退回！",
    returnedToast: "错送商品已退回！+10 金币",
    newStockCallout: "新货到场！",
    pickupCallout: "顾客取货！",
    dynamicShift: "忙班开始：随时准备应对变化。",
    waveDefault: "新货到了！",
    pickupDefault: "顾客改变了布局，把缺失商品补回来。",
    wrongDefault: "发现错送商品！把红标商品拖走退回。",
    levels: {
      "fridge-br-11": { wrongLabel: "发现错货！把红标商品拖走退回。", waves: ["迟到配送！又来了两件商品。"] },
      "fridge-br-12": { pickupLabel: "顾客取货！有一件商品需要重新补回。" },
      "fridge-br-13": { waves: ["烧烤补货！又到了一批瓶装商品。"] },
      "fridge-br-14": { waves: ["第二袋采购商品到了！"] },
      "fridge-br-15": { wrongLabel: "供货商送错了！退回红标商品。", pickupLabel: "主厨临时加单！重新补回一件商品。" },
      "fridge-br-16": { waves: ["派对客人又带来了更多饮料！"] },
      "fridge-br-17": { pickupLabel: "午夜加餐！把被拿走的商品补回来。" },
      "fridge-br-18": { waves: ["高峰配送！新货已经到场。"], pickupLabel: "顾客高峰！有一件商品被拿走了。" },
      "fridge-br-19": { pickupLabel: "节日临时订单！补回缺失商品。" },
      "fridge-br-20": { waves: ["最后一批配送到了！"], pickupLabel: "最后一次顾客取货打乱了计划！" },
    },
  },
  pt: {
    wrongItemName: "Entrega Errada",
    wrongCallout: "ENTREGA ERRADA!",
    returnedCallout: "DEVOLVIDO!",
    returnedToast: "Entrega errada devolvida! +10 moedas",
    newStockCallout: "NOVO ESTOQUE!",
    pickupCallout: "RETIRADA DO CLIENTE!",
    dynamicShift: "Turno dinamico: espere surpresas.",
    waveDefault: "Novo estoque chegou!",
    pickupDefault: "Um cliente mudou o plano. Reponha o item que falta.",
    wrongDefault: "Entrega errada! Arraste para fora o item com etiqueta vermelha.",
    levels: {
      "fridge-br-11": { wrongLabel: "Entrega errada! Arraste para fora o item com etiqueta vermelha.", waves: ["Entrega atrasada! Chegaram mais dois itens."] },
      "fridge-br-12": { pickupLabel: "Retirada do cliente! Um item precisa voltar para a geladeira." },
      "fridge-br-13": { waves: ["Reposicao do churrasco! Chegaram mais garrafas."] },
      "fridge-br-14": { waves: ["A segunda sacola de compras chegou!"] },
      "fridge-br-15": { wrongLabel: "Erro do fornecedor! Devolva o item com etiqueta vermelha.", pickupLabel: "Pedido do chef! Reponha um item." },
      "fridge-br-16": { waves: ["Os convidados trouxeram mais bebidas!"] },
      "fridge-br-17": { pickupLabel: "Lanche da meia-noite! Coloque um item de volta." },
      "fridge-br-18": { waves: ["Entrega urgente! O novo estoque chegou."], pickupLabel: "Correria de clientes! Um item foi retirado." },
      "fridge-br-19": { pickupLabel: "Pedido do festival! Reponha o item que falta." },
      "fridge-br-20": { waves: ["A ultima entrega chegou!"], pickupLabel: "Uma ultima retirada mudou o plano!" },
    },
  },
};

function copyFor(sceneOrPayload) {
  const locale = sceneOrPayload?.chromeData?.locale || sceneOrPayload?.uiState?.locale || "en";
  return COPY[locale] || COPY.en;
}

function localizedSpec(scene, levelId, spec) {
  const copy = copyFor(scene);
  const levelCopy = copy.levels[levelId] || {};
  return {
    ...spec,
    wrongLabel: levelCopy.wrongLabel || copy.wrongDefault,
    pickupLabel: levelCopy.pickupLabel || copy.pickupDefault,
    waves: (spec.waves || []).map((wave, index) => ({
      ...wave,
      label: levelCopy.waves?.[index] || copy.waveDefault,
    })),
  };
}

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

function writeEventSave(scene, patch) {
  try {
    const current = readEventSave(scene);
    localStorage.setItem(eventStorageKey(scene), JSON.stringify({ ...current, ...patch }));
  } catch {
    // Event persistence must never interrupt play.
  }
}

function levelWithDecoy(payload, spec) {
  if (!spec?.wrongDelivery || !payload.level) return payload;
  const level = structuredClone(payload.level);
  if (level.items.some((item) => item.eventDecoy)) return { ...payload, level };
  const source = level.items.find((item) => !item.fixed);
  if (!source) return { ...payload, level };
  const copy = copyFor(payload);
  level.items.push({
    ...structuredClone(source),
    id: `${level.id}__wrong_delivery`,
    name: copy.wrongItemName,
    fixed: true,
    eventDecoy: true,
    prefs: {},
    tags: ["event"],
    trayX: 655,
    trayY: 1110,
    scale: Number(((source.scale || 1) * 0.92).toFixed(4)),
  });
  return { ...payload, level };
}

function setupDecoy(scene, state) {
  const item = scene.level.items.find((entry) => entry.eventDecoy);
  if (!item) return;
  const sprite = scene.sprites.get(item.id);
  if (!sprite) return;

  if (state.wrongDone) {
    sprite.setVisible(false).setActive(false).disableInteractive();
    return;
  }

  sprite.setTint(0xff8b8b).setAlpha(1).setActive(true).setVisible(true);
  sprite.setInteractive({ draggable: true, pixelPerfect: false });
  scene.input.setDraggable(sprite);
  scene.time.delayedCall(1250, () => {
    if (scene.scene.isActive() && !state.wrongDone) {
      scene.playCallout(copyFor(scene).wrongCallout, "fire");
      scene.setToastMessage(state.spec.wrongLabel);
    }
  });
}

function returnDecoy(scene, state, obj) {
  if (state.wrongDone) return;
  const copy = copyFor(scene);
  state.wrongDone = true;
  writeEventSave(scene, { wrongDone: true });
  scene.clearHover();
  scene.hideWishBubble();
  scene.setItemLifted(obj, false);
  obj.disableInteractive();
  scene.tweens.killTweensOf(obj);
  scene.tweens.add({
    targets: obj,
    x: 790,
    y: Math.max(980, obj.y - 60),
    angle: 14,
    alpha: 0,
    duration: 360,
    ease: "Back.in(1.4)",
    onComplete: () => obj.setVisible(false).setActive(false),
  });
  scene.playCallout(copy.returnedCallout, "gold");
  scene.setToastMessage(copy.returnedToast);
  scene.events.emit("shelf-clear", { bonus: 10, streak: 0, source: "wrong-delivery" });
  scene.events.emit("mid-event", { type: "wrong-delivery-returned" });
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
      scene.tweens.add({ targets: sprite, alpha: 1, scaleX: baseScale, scaleY: baseScale, duration: 260, ease: "Back.out(1.8)" });
    }
  }
  if (animate) {
    scene.playCallout(copyFor(scene).newStockCallout, "gold");
    scene.setToastMessage(wave.label);
    scene.events.emit("mid-event", { type: "wave-revealed", ids: [...wave.ids] });
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
  if (state.pickupDone || state.pickupPending || !state.spec.pickupAfter) return;
  if (packedMovableCount(scene) < state.spec.pickupAfter) return;
  if (scene.engine.validate().complete) return;

  const candidates = movableIds(scene)
    .filter((id) => scene.engine.state.items[id]?.status === "packed")
    .filter((id) => id !== state.lastPlacedId);
  const id = candidates[0];
  if (!id) return;

  state.pickupPending = true;
  scene.time.delayedCall(420, () => {
    if (!scene.scene.isActive() || scene.engine.validate().complete) {
      state.pickupPending = false;
      return;
    }
    if (scene.engine.state.items[id]?.status !== "packed") {
      state.pickupPending = false;
      return;
    }

    const sprite = scene.sprites.get(id);
    if (sprite) scene.tweens.killTweensOf(sprite);
    scene.engine.moveOutside(id);
    state.pickupPending = false;
    state.pickupDone = true;
    writeEventSave(scene, { pickupDone: true });
    scene.playCallout(copyFor(scene).pickupCallout, "ice");
    scene.setToastMessage(state.spec.pickupLabel);
    scene.events.emit("mid-event", { type: "customer-pickup", itemId: id });
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
    const rawPayload = { ...this.entryData, ...data };
    const baseSpec = EVENTS[rawPayload.level?.id];
    const payload = levelWithDecoy(rawPayload, baseSpec);
    const result = originalCreate.call(this, payload);
    if (!baseSpec || this.editMode) return result;

    const spec = localizedSpec(this, this.level.id, baseSpec);
    if (payload.forceFresh) {
      try { localStorage.removeItem(eventStorageKey(this)); } catch { /* no-op */ }
    }
    const saved = readEventSave(this);
    this.midEventState = {
      spec,
      waves: prepareWaves(this, spec),
      pickupDone: !!saved.pickupDone,
      pickupPending: false,
      wrongDone: !!saved.wrongDone,
      lastPlacedId: null,
    };
    setupDecoy(this, this.midEventState);
    this.time.delayedCall(900, () => this.setToastMessage(copyFor(this).dynamicShift));
    return result;
  };

  StorageScene.prototype.onDragEnd = function dragEndWithMidEvents(obj) {
    const item = obj?.getData?.("item");
    const state = this.midEventState;
    if (state && item?.eventDecoy) {
      returnDecoy(this, state, obj);
      return { ok: true, event: "wrong-delivery" };
    }

    const before = item ? this.engine.state.items[item.id]?.status : null;
    const result = originalDragEnd.call(this, obj);
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
