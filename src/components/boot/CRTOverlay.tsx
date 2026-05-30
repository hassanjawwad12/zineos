"use client";

/**
 * Fixed, non-interactive CRT atmosphere: scanlines + grain + vignette, with a
 * faint flicker (disabled under reduced motion via CSS). Capped opacity keeps
 * it as texture, not interference.
 */
export function CRTOverlay() {
  return (
    <div className="crt" aria-hidden="true">
      <div className="crt-scanlines" />
      <div className="crt-grain" />
      <div className="crt-vignette" />
    </div>
  );
}
