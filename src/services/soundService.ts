// Synthesized UI sound effects via Web Audio API.
// No external assets required; everything is generated on demand.

export type SoundName =
  | 'click'
  | 'success'
  | 'warn'
  | 'error'
  | 'play'
  | 'pause'
  | 'like'
  | 'notify'
  | 'deploy'
  | 'scan'
  | 'toggle';

const STORAGE_KEY = 'vdj.sound.enabled';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = readEnabled();
let masterVolume = 0.45;

function readEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v == null ? true : v === '1';
  } catch {
    return true;
  }
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.25,
  freqEnd?: number,
) {
  const audio = ensureContext();
  if (!audio || !masterGain) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  const t0 = audio.currentTime + startOffset;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + duration);
  }

  // Soft attack/release envelope to avoid clicks.
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(startOffset: number, duration: number, peakGain = 0.15) {
  const audio = ensureContext();
  if (!audio || !masterGain) return;
  const buffer = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * duration)), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  const gain = audio.createGain();
  const t0 = audio.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

const PATTERNS: Record<SoundName, () => void> = {
  click: () => tone(880, 0, 0.06, 'triangle', 0.18),
  toggle: () => {
    tone(660, 0, 0.05, 'square', 0.12);
    tone(990, 0.05, 0.08, 'square', 0.12);
  },
  success: () => {
    tone(660, 0, 0.09, 'sine', 0.22);
    tone(990, 0.09, 0.14, 'sine', 0.22);
  },
  warn: () => {
    tone(520, 0, 0.1, 'square', 0.18);
    tone(390, 0.1, 0.16, 'square', 0.18);
  },
  error: () => {
    tone(220, 0, 0.18, 'sawtooth', 0.22, 110);
  },
  play: () => {
    tone(440, 0, 0.18, 'sine', 0.22, 880);
  },
  pause: () => {
    tone(660, 0, 0.16, 'sine', 0.2, 330);
  },
  like: () => {
    tone(880, 0, 0.07, 'triangle', 0.2);
    tone(1320, 0.08, 0.1, 'triangle', 0.2);
  },
  notify: () => {
    tone(1175, 0, 0.09, 'sine', 0.2);
    tone(1568, 0.09, 0.14, 'sine', 0.2);
  },
  deploy: () => {
    tone(330, 0, 0.12, 'sawtooth', 0.18, 660);
    tone(660, 0.12, 0.14, 'sine', 0.2, 990);
    noise(0, 0.25, 0.05);
  },
  scan: () => {
    tone(1200, 0, 0.07, 'square', 0.12);
    tone(900, 0.08, 0.07, 'square', 0.12);
    tone(1200, 0.16, 0.07, 'square', 0.12);
  },
};

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    PATTERNS[name]?.();
  } catch {
    // Audio failures are non-fatal; ignore.
  }
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Persistence is best effort.
  }
  if (value) ensureContext();
}

export function isSoundEnabled() {
  return enabled;
}

// Browsers require a user gesture before audio can play. Call this on the
// first interaction so subsequent automated sounds work without delay.
export function unlockAudio() {
  ensureContext();
}
