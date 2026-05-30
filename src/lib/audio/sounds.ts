/**
 * Synthesized 8-bit UI sounds — pure parameter specs, no Web Audio here so they
 * can be unit-tested. The engine turns each spec into an oscillator + gain
 * envelope. All frequencies/gains are > 0 so exponential ramps stay valid.
 */

export type SoundName = "click" | "stamp" | "trash" | "snap";

export interface SoundSpec {
  readonly type: OscillatorType;
  readonly freqStart: number; // Hz
  readonly freqEnd: number; // Hz (pitch sweep target)
  readonly duration: number; // seconds
  readonly gain: number; // peak amplitude (0–1)
}

export const SOUND_SPECS: Record<SoundName, SoundSpec> = {
  // Soft tactile tick for chrome buttons.
  click: {
    type: "square",
    freqStart: 880,
    freqEnd: 640,
    duration: 0.05,
    gain: 0.04,
  },
  // Punchy "stamp" when a sticker lands on the canvas.
  stamp: {
    type: "triangle",
    freqStart: 320,
    freqEnd: 90,
    duration: 0.12,
    gain: 0.09,
  },
  // Descending "trash" sweep on delete.
  trash: {
    type: "sawtooth",
    freqStart: 360,
    freqEnd: 70,
    duration: 0.18,
    gain: 0.06,
  },
  // Tiny high blip for an angle/edge snap.
  snap: {
    type: "square",
    freqStart: 1320,
    freqEnd: 1320,
    duration: 0.03,
    gain: 0.05,
  },
};
