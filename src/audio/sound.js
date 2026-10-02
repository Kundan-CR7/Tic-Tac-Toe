/*
 * Tiny Web Audio synth: every effect is a few enveloped oscillators, so
 * there are no audio files to download.
 */

let context = null;
let output = null;

function getContext() {
  if (context) return context;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  // Creating a context before the first user gesture makes Chrome log an
  // autoplay warning, and it would stay silent anyway.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  context = new AudioContextClass();
  const compressor = context.createDynamicsCompressor();
  output = context.createGain();
  output.gain.value = 0.6;
  output.connect(compressor).connect(context.destination);
  return context;
}

function tone(ctx, { frequency, to, start = 0, duration = 0.15, type = "sine", gain = 0.15, attack = 0.006 }) {
  const t0 = ctx.currentTime + start;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, t0);
  if (to) oscillator.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  envelope.gain.setValueAtTime(0.0001, t0);
  envelope.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  oscillator.connect(envelope).connect(output);
  oscillator.start(t0);
  oscillator.stop(t0 + duration + 0.05);
}

const SOUNDS = {
  "place-X": (ctx) => {
    tone(ctx, { frequency: 680, to: 430, duration: 0.11, type: "triangle", gain: 0.2 });
    tone(ctx, { frequency: 1800, duration: 0.03, gain: 0.04 });
  },
  "place-O": (ctx) => {
    tone(ctx, { frequency: 400, to: 640, duration: 0.14, gain: 0.22 });
  },
  win: (ctx) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
      tone(ctx, { frequency, start: index * 0.085, duration: 0.42, type: "triangle", gain: 0.13 }),
    );
    tone(ctx, { frequency: 2093, start: 0.34, duration: 0.5, gain: 0.03 });
  },
  lose: (ctx) => {
    [392, 329.63, 261.63].forEach((frequency, index) =>
      tone(ctx, { frequency, to: frequency * 0.97, start: index * 0.13, duration: 0.32, gain: 0.13 }),
    );
  },
  draw: (ctx) => {
    tone(ctx, { frequency: 587.33, duration: 0.22, type: "triangle", gain: 0.11 });
    tone(ctx, { frequency: 440, start: 0.16, duration: 0.36, type: "triangle", gain: 0.11 });
  },
  undo: (ctx) => {
    tone(ctx, { frequency: 540, to: 330, duration: 0.12, gain: 0.12 });
  },
  blocked: (ctx) => {
    tone(ctx, { frequency: 190, to: 120, duration: 0.12, type: "triangle", gain: 0.14 });
  },
  start: (ctx) => {
    tone(ctx, { frequency: 392, to: 587.33, duration: 0.2, gain: 0.09 });
  },
  toggle: (ctx) => {
    tone(ctx, { frequency: 880, duration: 0.06, gain: 0.1 });
  },
};

export function playSound(name) {
  const effect = SOUNDS[name];
  if (!effect) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    effect(ctx);
  } catch {
    // Audio is decorative; never let it break a move.
  }
}
