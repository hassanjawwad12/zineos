import type { SoundName } from "./sounds";

/**
 * Lazy entry point for UI sounds. The Web Audio engine is dynamically imported
 * on first use (per the perf budget — audio never ships in the initial bundle),
 * then cached. Callers gate on the user's sound preference.
 */

let enginePromise: Promise<typeof import("./engine")> | null = null;

export function playUiSound(name: SoundName): void {
  if (typeof window === "undefined") return;
  if (!enginePromise) enginePromise = import("./engine");
  enginePromise.then((m) => m.playSound(name)).catch(() => {});
}
