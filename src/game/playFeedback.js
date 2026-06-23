function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createUiSounds() {
  let ctx = null;

  function ensureContext() {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      ctx = new AudioContextCtor();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({ frequency, duration = 0.08, type = "sine", volume = 0.04, attack = 0.004, slideTo = null, when = 0 }) {
    const audio = ensureContext();
    if (!audio) return;
    const now = audio.currentTime + when;
    const gain = audio.createGain();
    const osc = audio.createOscillator();
    const endAt = now + duration;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(clamp(volume, 0.0001, 1), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, endAt);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(endAt + 0.01);
  }

  return {
    unlock() {
      ensureContext();
    },
    snap() {
      tone({ frequency: 720, slideTo: 980, duration: 0.06, type: "triangle", volume: 0.028 });
      tone({ frequency: 1180, duration: 0.04, type: "sine", volume: 0.016, when: 0.01 });
    },
    miss() {
      tone({ frequency: 230, slideTo: 170, duration: 0.12, type: "sawtooth", volume: 0.024 });
    },
    phase() {
      tone({ frequency: 480, duration: 0.07, type: "triangle", volume: 0.026 });
      tone({ frequency: 640, duration: 0.08, type: "triangle", volume: 0.022, when: 0.06 });
    },
    success() {
      tone({ frequency: 520, duration: 0.08, type: "triangle", volume: 0.03 });
      tone({ frequency: 780, duration: 0.1, type: "triangle", volume: 0.028, when: 0.08 });
      tone({ frequency: 1040, duration: 0.13, type: "sine", volume: 0.025, when: 0.18 });
    },
    dispose() {
      if (!ctx) return;
      ctx.close().catch(() => {});
      ctx = null;
    },
  };
}
