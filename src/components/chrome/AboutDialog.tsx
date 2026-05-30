"use client";

import { useRef } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Help → About. Doubles as the repo's elevator pitch (the 3-bullet story). */
export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, open);

  if (!open) return null;

  return (
    <div
      className="about-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className="about"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <header className="about-titlebar">
          <span id="about-title">About ZINEOS</span>
          <button
            type="button"
            className="about-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        <div className="about-body">
          <h2 className="about-logo holo-text">ZINEOS</h2>
          <p>
            A maximalist Y2K collage studio that boots like a haunted operating
            system. Build holographic zines from live GIPHY stickers — then
            export or share them with no backend.
          </p>
          <ul>
            <li>
              Hand-built 2D transform engine (drag / resize /
              rotate-while-rotated) from raw pointer math — no editor library.
            </li>
            <li>
              Live GIPHY search through a server-side proxy; the image proxy
              keeps canvas export CORS-safe.
            </li>
            <li>
              Flattened PNG export via manual canvas compositing, and the whole
              scene shared as a compressed URL.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
