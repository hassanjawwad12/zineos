import { SOUND_SPECS, type SoundName } from "./sounds";

/**
 * Raw Web Audio engine — no Tone.js. A single lazily-created AudioContext
 * (browsers require a user gesture to start one, which our click-driven sounds
 * naturally provide). Each call builds a short oscillator + gain envelope and
 * tears it down on stop. Fails silent on unsupported environments.
 */

let ctx: AudioContext | null = null;

type AudioCtor = typeof AudioContext;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Play a synthesized sound. No-op (never throws) if audio is unavailable. */
export function playSound(name: SoundName): void {
  const audio = getContext();
  if (!audio) return;

  try {
    const spec = SOUND_SPECS[name];
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(spec.freqEnd, t + spec.duration);

    gain.gain.setValueAtTime(spec.gain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + spec.duration);
  } catch {
    // Audio is non-essential juice — never let it break an interaction.
  }
}
