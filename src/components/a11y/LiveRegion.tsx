"use client";

import { useAnnouncer } from "@/store/useAnnouncer";

/**
 * Visually-hidden polite live region. Keying on `nth` forces React to re-render
 * (and screen readers to re-announce) even when the same message repeats.
 */
export function LiveRegion() {
  const message = useAnnouncer((s) => s.message);
  const nth = useAnnouncer((s) => s.nth);

  return (
    <div
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span key={nth}>{message}</span>
    </div>
  );
}
