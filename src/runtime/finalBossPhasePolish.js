import { StorageScene } from "../game/StorageScene.js";

let applied = false;

const COPY = {
  en: {
    phase1Title: "SHIFT 1: BUILD THE BASE",
    phase1Body: "Festival night starts now. More stock is coming.",
    phase2Title: "SHIFT 2: LAST DELIVERY",
    phase2Body: "New stock is here. Re-plan without losing the base.",
    phase2Resume: "New stock is active. Re-plan the cabinet.",
    phase3Title: "SHIFT 3: RECOVERY",
    phase3Body: "One last pickup changed the cabinet. Restore it cleanly.",
    phase3Resume: "Restore the missing item and finish the night strong.",
    finalStretch: "Final stretch of the night: one clean finish.",
  },
  cn: {
    phase1Title: "第一班：搭稳基础",
    phase1Body: "街区节日开场了，后面还有新货会到。",
    phase2Title: "第二班：最后配送",
    phase2Body: "新货到了，在不破坏基础布局的前提下重新规划。",
    phase2Resume: "追加商品已经到场，重新规划冷柜。",
    phase3Title: "第三班：恢复布局",
    phase3Body: "最后一次顾客取货打乱了冷柜，把它整理回来。",
    phase3Resume: "补回缺失商品，漂亮结束今晚。",
    finalStretch: "今晚最后冲刺：干净利落地收尾。",
  },
  pt: {
    phase1Title: "TURNO 1: MONTE A BASE",
    phase1Body: "A noite do festival comecou. Mais estoque ainda vai chegar.",
    phase2Title: "TURNO 2: ULTIMA ENTREGA",
    phase2Body: "O novo estoque chegou. Replaneje sem perder a base.",
    phase2Resume: "O novo estoque esta ativo. Reorganize a geladeira.",
    phase3Title: "TURNO 3: RECUPERACAO",
    phase3Body: "Uma ultima retirada mudou a geladeira. Recupere o arranjo com cuidado.",
    phase3Resume: "Reponha o item que falta e termine a noite com forca.",
    finalStretch: "Reta final da noite: termine com uma jogada limpa.",
  },
};

function copyFor(scene) {
  return COPY[scene.chromeData?.locale] || COPY.en;
}

function packedCount(scene) {
  return scene.level.items
    .filter((item) => !item.fixed)
    .filter((item) => scene.engine.state.items[item.id]?.status === "packed")
    .length;
}

function announce(scene, title, message, tone = "gold") {
  if (!scene.scene.isActive() || scene.engine.validate().complete) return;
  scene.playCallout(title, tone);
  scene.setToastMessage(message);
}

export function applyFinalBossPhasePolish() {
  if (applied) return;
  applied = true;

  const originalCreate = StorageScene.prototype.create;

  StorageScene.prototype.create = function createWithBossPhases(data) {
    const result = originalCreate.call(this, data);
    if (this.level?.id !== "fridge-br-20" || this.editMode) return result;

    const copy = copyFor(this);
    const eventState = this.midEventState;
    const waveAlreadyShown = !!eventState?.waves?.[0]?.revealed;
    const pickupAlreadyDone = !!eventState?.pickupDone;
    this.finalBossState = { phase: pickupAlreadyDone ? 3 : waveAlreadyShown ? 2 : 1 };

    const moveToPhase2 = () => {
      if (!this.finalBossState || this.finalBossState.phase >= 2) return;
      this.finalBossState.phase = 2;
      this.time.delayedCall(140, () => announce(this, copy.phase2Title, copy.phase2Body, "gold"));
    };

    const moveToPhase3 = () => {
      if (!this.finalBossState || this.finalBossState.phase >= 3) return;
      this.finalBossState.phase = 3;
      this.time.delayedCall(140, () => announce(this, copy.phase3Title, copy.phase3Body, "ice"));
    };

    const onMidEvent = (event) => {
      if (event?.type === "wave-revealed") moveToPhase2();
      if (event?.type === "customer-pickup") moveToPhase3();
    };

    const onSnap = () => {
      if (this.finalBossState?.phase === 3 && packedCount(this) >= 5 && !this.engine.validate().complete) {
        this.setToastMessage(copy.finalStretch);
      }
    };

    this.events.on("mid-event", onMidEvent);
    this.events.on("snap", onSnap);
    this.events.once("shutdown", () => {
      this.events.off("mid-event", onMidEvent);
      this.events.off("snap", onSnap);
    });

    this.time.delayedCall(1150, () => {
      const phase = this.finalBossState?.phase || 1;
      if (phase === 1) announce(this, copy.phase1Title, copy.phase1Body, "fire");
      else if (phase === 2) announce(this, copy.phase2Title, copy.phase2Resume, "gold");
      else announce(this, copy.phase3Title, copy.phase3Resume, "ice");
    });
    return result;
  };
}
