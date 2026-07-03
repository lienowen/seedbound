function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createUiSounds() {
  let ctx = null;
  let voiceLocale = "en";
  let lastSpokenAt = 0;
  let lastSpokenText = "";
  let cachedVoice = null;

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

  function speechApi() {
    if (typeof window === "undefined") return null;
    return window.speechSynthesis || null;
  }

  function normalizeLocale(locale = "en") {
    if (locale === "cn") return "zh-CN";
    if (locale === "pt") return "pt-BR";
    return "en-US";
  }

  function chooseVoice(preferredLocale) {
    const synth = speechApi();
    if (!synth) return null;
    const wanted = normalizeLocale(preferredLocale).toLowerCase();
    const voices = synth.getVoices?.() || [];
    if (!voices.length) return null;

    const exact = voices.find((voice) => voice.lang?.toLowerCase() === wanted);
    if (exact) return exact;

    const localePrefix = wanted.split("-")[0];
    const sameFamily = voices.find((voice) => voice.lang?.toLowerCase().startsWith(localePrefix));
    if (sameFamily) return sameFamily;

    return voices.find((voice) => voice.default) || voices[0] || null;
  }

  function speakCallout(text, options = {}) {
    const synth = speechApi();
    if (!synth || typeof window === "undefined" || typeof window.SpeechSynthesisUtterance === "undefined") return;
    if (!text || voiceLocale !== "en") return;

    const now = Date.now();
    const compactText = String(text).trim();
    if (!compactText) return;
    if (compactText === lastSpokenText && now - lastSpokenAt < 1400) return;
    if (now - lastSpokenAt < 260) synth.cancel();

    const utterance = new window.SpeechSynthesisUtterance(compactText);
    cachedVoice = chooseVoice(voiceLocale) || cachedVoice;
    if (cachedVoice) utterance.voice = cachedVoice;
    utterance.lang = normalizeLocale(voiceLocale);
    utterance.rate = options.rate ?? 1.02;
    utterance.pitch = options.pitch ?? 1.02;
    utterance.volume = options.volume ?? 0.82;

    lastSpokenText = compactText;
    lastSpokenAt = now;
    synth.cancel();
    synth.speak(utterance);
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
      speechApi()?.getVoices?.();
    },
    setLocale(locale) {
      voiceLocale = locale || "en";
      cachedVoice = chooseVoice(voiceLocale) || cachedVoice;
    },
    snap() {
      tone({ frequency: 720, slideTo: 980, duration: 0.08, type: "triangle", volume: 0.06 });
      tone({ frequency: 1180, duration: 0.05, type: "sine", volume: 0.04, when: 0.02 });
    },
    miss() {
      tone({ frequency: 230, slideTo: 170, duration: 0.12, type: "sawtooth", volume: 0.024 });
    },
    // Soft "picked up" pop when a packing item is grabbed.
    pickup() {
      tone({ frequency: 320, slideTo: 460, duration: 0.06, type: "sine", volume: 0.035 });
    },
    // Crisp double-click when an item rotates 90 degrees.
    rotate() {
      tone({ frequency: 620, duration: 0.035, type: "square", volume: 0.03 });
      tone({ frequency: 880, duration: 0.045, type: "triangle", volume: 0.03, when: 0.04 });
    },
    // Gentle "nope" thud when a rotation/placement has no room (softer than miss).
    blocked() {
      tone({ frequency: 200, slideTo: 150, duration: 0.09, type: "sine", volume: 0.03 });
    },
    // Chunky "clicked into place" thunk for a packing snap into the grid.
    lock() {
      tone({ frequency: 180, slideTo: 120, duration: 0.09, type: "sine", volume: 0.05 });
      tone({ frequency: 560, slideTo: 760, duration: 0.06, type: "triangle", volume: 0.045, when: 0.01 });
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
    // Rising combo sound — pitch climbs with each level
    comboRising(level = 1) {
      const baseFreq = 440 + level * 120;
      tone({ frequency: baseFreq, slideTo: baseFreq * 1.5, duration: 0.12, type: "triangle", volume: 0.06 + level * 0.01 });
      tone({ frequency: baseFreq * 1.25, duration: 0.08, type: "sine", volume: 0.04, when: 0.05 });
    },
    // Fanfare for big moments — multiple ascending notes
    fanfare() {
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        tone({ frequency: freq, duration: 0.15, type: "triangle", volume: 0.07, when: i * 0.1 });
      });
      // Bass hit
      tone({ frequency: 130, duration: 0.3, type: "sine", volume: 0.08, when: 0 });
    },
    // Impact sound for callouts
    impact() {
      tone({ frequency: 80, slideTo: 40, duration: 0.25, type: "sine", volume: 0.1 });
      tone({ frequency: 200, slideTo: 300, duration: 0.12, type: "triangle", volume: 0.05, when: 0.03 });
    },
    speakCallout(text, options) {
      speakCallout(text, options);
    },
    dispose() {
      speechApi()?.cancel?.();
      if (!ctx) return;
      ctx.close().catch(() => {});
      ctx = null;
    },
  };
}
