import { create } from "zustand";

/**
 * Screen-reader announcements. A freeform canvas is hard to perceive without
 * narration, so meaningful actions ("Sticker added", "Moved to front") are
 * pushed here and read out by an aria-live region. A monotonic `nth` guarantees
 * repeated identical messages still re-announce.
 */
interface AnnouncerState {
  message: string;
  nth: number;
  announce: (message: string) => void;
}

export const useAnnouncer = create<AnnouncerState>((set) => ({
  message: "",
  nth: 0,
  announce: (message) => set((s) => ({ message, nth: s.nth + 1 })),
}));

/** Imperative helper for non-React call sites. */
export function announce(message: string): void {
  useAnnouncer.getState().announce(message);
}
