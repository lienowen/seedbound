import { useMemo, useRef, useState } from "react";
import { ShiftEngine } from "../model/shiftEngine.js";
import { visibleGapCount } from "../model/storeModel.js";
import {
  buildMorningRushShift,
  clearUrgentPriorityWhenDone,
  injectCustomerGapRecovery,
} from "../data/rushShift.js";

function nextWorkSceneId(state) {
  for (const task of state.tasks) {
    if (task.complete || task.optional || !task.bayId) continue;
    const bay = state.bays[task.bayId];
    if (bay?.sceneId) return bay.sceneId;
  }
  return null;
}

export function useMorningRush() {
  const shift = useMemo(buildMorningRushShift, []);
  const engineRef = useRef(new ShiftEngine(shift));
  const [state, setState] = useState(() => engineRef.current.snapshot());
  const [message, setMessage] = useState("Read the rush priorities, then clock in.");
  const [drag, setDrag] = useState(null);
  const [score, setScore] = useState(null);
  const [customerEvent, setCustomerEvent] = useState(false);

  const engine = engineRef.current;
  const scene = shift.scenes.find((entry) => entry.id === state.currentSceneId) || null;
  const bay = Object.values(state.bays).find((entry) => entry.sceneId === state.currentSceneId) || null;
  const nextSceneId = nextWorkSceneId(state);
  const nextScene = shift.scenes.find((entry) => entry.id === nextSceneId) || null;

  function sync(text = null) {
    setState(engine.snapshot());
    if (text) setMessage(text);
  }

  function start() {
    const result = engine.startShift();
    sync(result.ok ? "Load both priority cases onto the stock cart." : result.reason);
  }

  function loadCase(caseId) {
    const result = engine.loadCase(caseId);
    sync(result.ok ? "Case loaded." : result.reason);
  }

  function moveTo(sceneId) {
    if (!sceneId) return;
    const result = engine.moveToScene(sceneId);
    sync(result.ok ? "Arrived at the next priority bay." : result.reason);
  }

  function beginDrag(event, unit) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({
      unitId: unit.id,
      skuId: unit.skuId,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  function moveDrag(event) {
    setDrag((current) => current?.pointerId === event.pointerId
      ? { ...current, clientX: event.clientX, clientY: event.clientY }
      : current);
  }

  function endDrag(event) {
    const current = drag;
    setDrag(null);
    if (!current || current.pointerId !== event.pointerId) return;

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-bay-id]");
    const bayId = target?.dataset?.bayId;
    if (!bayId) {
      setMessage("Drop stock onto a visible shelf gap.");
      return;
    }

    const result = engine.placeUnit(current.unitId, bayId);
    if (!result.ok) {
      sync(result.reason === "wrong-department-or-fixture"
        ? "That SKU belongs in another department."
        : result.reason);
      return;
    }

    const nextBay = engine.state.bays[bayId];
    const gaps = visibleGapCount(nextBay);
    sync(result.bayFull ? "Bay stocked. Face it before leaving." : `${gaps} gap${gaps === 1 ? "" : "s"} remain.`);
  }

  function faceCurrentBay() {
    if (!bay) return;
    const result = engine.faceBay(bay.id);
    if (!result.ok) {
      sync(result.reason);
      return;
    }

    const firstDairyFace = bay.id === "rush-dairy-bay"
      && !engine.state.eventsTriggered.includes("customer-removes-milk");

    if (firstDairyFace && injectCustomerGapRecovery(engine)) {
      setCustomerEvent(true);
      sync("Customer took a milk. Use the spare unit on your cart to recover the new gap.");
      return;
    }

    clearUrgentPriorityWhenDone(engine);

    const finish = engine.finishShift();
    if (finish.ok) {
      setScore(finish.score);
      sync("Morning rush recovered.");
      return;
    }

    const upcomingId = nextWorkSceneId(engine.state);
    const upcoming = shift.scenes.find((entry) => entry.id === upcomingId);
    sync(upcoming ? `Bay complete. Next priority: ${upcoming.department || upcoming.kind}.` : "Continue remaining work.");
  }

  function reset() {
    engineRef.current = new ShiftEngine(shift);
    setState(engineRef.current.snapshot());
    setMessage("Read the rush priorities, then clock in.");
    setDrag(null);
    setScore(null);
    setCustomerEvent(false);
  }

  return {
    shift,
    state,
    scene,
    bay,
    nextScene,
    drag,
    score,
    message,
    customerEvent,
    dismissCustomerEvent: () => setCustomerEvent(false),
    start,
    loadCase,
    moveTo,
    beginDrag,
    moveDrag,
    endDrag,
    faceCurrentBay,
    reset,
  };
}
