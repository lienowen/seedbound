import {
  TASK_KIND,
  firstAvailableCell,
  fixtureCanTakeSku,
  getSku,
  isShelfFull,
  planogramAllowsSkuAtCell,
  visibleGapCount,
} from "./storeModel.js";

function clone(value) {
  return structuredClone(value);
}

export class ShiftEngine {
  constructor(shiftDefinition) {
    if (!shiftDefinition?.id) throw new Error("Shift definition id is required");
    this.definition = clone(shiftDefinition);
    this.state = {
      phase: "briefing",
      currentSceneId: shiftDefinition.startSceneId,
      clockSeconds: 0,
      cart: clone(shiftDefinition.initialCart || []),
      cases: clone(shiftDefinition.cases || []),
      bays: Object.fromEntries((shiftDefinition.bays || []).map((bay) => [bay.id, clone(bay)])),
      tasks: clone(shiftDefinition.tasks || []),
      completedTaskIds: [],
      eventsTriggered: [],
      metrics: {
        correctPlacements: 0,
        wrongPlacements: 0,
        facingsCompleted: 0,
        damagedRemoved: 0,
        backstockUnits: 0,
        customerHelped: 0,
      },
    };
  }

  snapshot() {
    return clone(this.state);
  }

  currentScene() {
    return this.definition.scenes?.find((entry) => entry.id === this.state.currentSceneId) || null;
  }

  startShift() {
    if (this.state.phase !== "briefing") return { ok: false, reason: "shift-already-started" };
    this.state.phase = "working";
    return { ok: true };
  }

  moveToScene(sceneId) {
    if (this.state.phase !== "working") return { ok: false, reason: "shift-not-working" };
    const scene = this.definition.scenes?.find((entry) => entry.id === sceneId);
    if (!scene) return { ok: false, reason: "scene-not-found" };
    this.state.currentSceneId = sceneId;
    this.state.clockSeconds += Number(scene.travelSeconds || 0);
    return { ok: true, sceneId };
  }

  loadCase(caseId) {
    if (this.state.phase !== "working") return { ok: false, reason: "shift-not-working" };
    const scene = this.currentScene();
    if (scene?.kind !== "backroom") return { ok: false, reason: "must-load-in-backroom" };

    const stockCase = this.state.cases.find((entry) => entry.id === caseId);
    if (!stockCase) return { ok: false, reason: "case-not-found" };
    if (stockCase.loaded) return { ok: false, reason: "case-already-loaded" };

    stockCase.loaded = true;
    for (let unit = 0; unit < stockCase.quantity; unit += 1) {
      this.state.cart.push({
        id: `${stockCase.id}-unit-${unit + 1}`,
        skuId: stockCase.skuId,
        sourceCaseId: stockCase.id,
        expiryDay: stockCase.expiryDay ?? null,
        damaged: false,
      });
    }
    this.completeMatchingTask(TASK_KIND.LOAD_CASE, { caseId });
    const events = this.runTriggeredEvents();
    return { ok: true, loadedUnits: stockCase.quantity, events };
  }

  placeUnit(unitId, bayId, requestedCell = null) {
    if (this.state.phase !== "working") return { ok: false, reason: "shift-not-working" };
    const unitIndex = this.state.cart.findIndex((entry) => entry.id === unitId);
    if (unitIndex < 0) return { ok: false, reason: "unit-not-on-cart" };
    const unit = this.state.cart[unitIndex];
    const bay = this.state.bays[bayId];
    if (!bay) return { ok: false, reason: "bay-not-found" };
    if (bay.sceneId !== this.state.currentSceneId) return { ok: false, reason: "wrong-scene" };
    if (unit.damaged) return { ok: false, reason: "damaged-unit-cannot-be-stocked" };
    if (!fixtureCanTakeSku(bay, unit.skuId)) {
      this.state.metrics.wrongPlacements += 1;
      return { ok: false, reason: "wrong-department-or-fixture" };
    }

    const sku = getSku(unit.skuId);
    const footprint = Math.max(1, Number(sku?.footprint || 1));
    if (visibleGapCount(bay) < footprint) return { ok: false, reason: "no-shelf-capacity" };

    const autoCell = firstAvailableCell(bay, footprint, unit.skuId);
    const cell = Number.isInteger(requestedCell) ? requestedCell : autoCell;
    if (cell < 0 || cell + footprint > bay.capacity) {
      return { ok: false, reason: "no-contiguous-shelf-gap" };
    }
    if (!planogramAllowsSkuAtCell(bay, unit.skuId, cell, footprint)) {
      this.state.metrics.wrongPlacements += 1;
      return { ok: false, reason: "wrong-planogram-facing" };
    }

    const occupied = new Set();
    for (const facing of bay.facings) {
      const start = Math.max(0, Number(facing.cell || 0));
      const width = Math.max(1, Number(facing.footprint || 1));
      for (let offset = 0; offset < width; offset += 1) occupied.add(start + offset);
    }
    for (let offset = 0; offset < footprint; offset += 1) {
      if (occupied.has(cell + offset)) return { ok: false, reason: "no-contiguous-shelf-gap" };
    }

    bay.facings.push({
      unitId: unit.id,
      skuId: unit.skuId,
      footprint,
      expiryDay: unit.expiryDay,
      cell,
    });
    bay.facings.sort((a, b) => Number(a.cell || 0) - Number(b.cell || 0));
    bay.faced = false;
    this.state.cart.splice(unitIndex, 1);
    this.state.metrics.correctPlacements += 1;
    this.state.clockSeconds += 2;

    this.completeMatchingTask(TASK_KIND.REPLENISH, { bayId, skuId: unit.skuId });
    const events = this.runTriggeredEvents();
    return { ok: true, bayFull: isShelfFull(bay), cell, events };
  }

  faceBay(bayId) {
    if (this.state.phase !== "working") return { ok: false, reason: "shift-not-working" };
    const bay = this.state.bays[bayId];
    if (!bay) return { ok: false, reason: "bay-not-found" };
    if (bay.sceneId !== this.state.currentSceneId) return { ok: false, reason: "wrong-scene" };
    if (!bay.facings.length) return { ok: false, reason: "nothing-to-face" };
    if (visibleGapCount(bay) > 0) return { ok: false, reason: "bay-not-recovered" };

    bay.facings.sort((a, b) => Number(a.cell || 0) - Number(b.cell || 0));
    bay.faced = true;
    this.state.metrics.facingsCompleted += 1;
    this.state.clockSeconds += 3;
    this.completeMatchingTask(TASK_KIND.FACE, { bayId });
    const events = this.runTriggeredEvents();
    return { ok: true, events };
  }

  runTriggeredEvents() {
    const triggered = [];
    for (const event of this.definition.events || []) {
      if (this.state.eventsTriggered.includes(event.id)) continue;
      const afterTaskId = event.trigger?.afterTaskId;
      if (afterTaskId && !this.state.completedTaskIds.includes(afterTaskId)) continue;

      let result = { ok: true };
      if (event.action?.type === "customer-takes") {
        result = this.customerTakes(event.action.bayId, event.action.skuId);
      }
      if (!result.ok) continue;

      this.state.eventsTriggered.push(event.id);
      triggered.push({
        id: event.id,
        createsPriority: event.createsPriority || null,
        action: clone(event.action || {}),
        result: clone(result),
      });
    }
    return triggered;
  }

  customerTakes(bayId, skuId) {
    const bay = this.state.bays[bayId];
    if (!bay) return { ok: false, reason: "bay-not-found" };
    const index = bay.facings.findIndex((entry) => entry.skuId === skuId);
    if (index < 0) return { ok: false, reason: "sku-not-on-bay" };
    const [removed] = bay.facings.splice(index, 1);
    bay.faced = false;
    return { ok: true, removed, gapCell: removed.cell };
  }

  markUnitDamaged(unitId) {
    const unit = this.state.cart.find((entry) => entry.id === unitId);
    if (!unit) return { ok: false, reason: "unit-not-on-cart" };
    unit.damaged = true;
    return { ok: true };
  }

  removeDamaged(unitId) {
    const index = this.state.cart.findIndex((entry) => entry.id === unitId && entry.damaged);
    if (index < 0) return { ok: false, reason: "damaged-unit-not-found" };
    this.state.cart.splice(index, 1);
    this.state.metrics.damagedRemoved += 1;
    this.completeMatchingTask(TASK_KIND.REMOVE_DAMAGE, { unitId });
    return { ok: true };
  }

  backstockUnit(unitId) {
    const index = this.state.cart.findIndex((entry) => entry.id === unitId);
    if (index < 0) return { ok: false, reason: "unit-not-on-cart" };
    this.state.cart.splice(index, 1);
    this.state.metrics.backstockUnits += 1;
    this.completeMatchingTask(TASK_KIND.BACKSTOCK, { unitId });
    return { ok: true };
  }

  completeMatchingTask(kind, context = {}) {
    for (const task of this.state.tasks) {
      if (task.kind !== kind || task.complete) continue;
      if (task.caseId && task.caseId !== context.caseId) continue;
      if (task.bayId && task.bayId !== context.bayId) continue;
      if (task.skuId && task.skuId !== context.skuId) continue;

      task.progress = Math.min(task.target || 1, Number(task.progress || 0) + 1);
      if (task.progress >= (task.target || 1)) {
        task.complete = true;
        this.state.completedTaskIds.push(task.id);
      }
      return task;
    }
    return null;
  }

  isComplete() {
    return this.state.tasks.every((task) => task.complete || task.optional);
  }

  finishShift() {
    if (!this.isComplete()) return { ok: false, reason: "required-work-incomplete" };
    this.state.phase = "complete";
    return { ok: true, score: this.score() };
  }

  score() {
    const { metrics } = this.state;
    const placementAttempts = metrics.correctPlacements + metrics.wrongPlacements;
    const accuracy = placementAttempts
      ? Math.round((metrics.correctPlacements / placementAttempts) * 100)
      : 100;

    const bays = Object.values(this.state.bays);
    const availability = bays.length
      ? Math.round((bays.reduce((sum, bay) => sum + (1 - visibleGapCount(bay) / bay.capacity), 0) / bays.length) * 100)
      : 100;
    const facing = bays.length
      ? Math.round((bays.filter((bay) => bay.faced).length / bays.length) * 100)
      : 100;

    return {
      availability,
      accuracy,
      facing,
      wasteControl: 100,
      elapsedSeconds: this.state.clockSeconds,
    };
  }
}
