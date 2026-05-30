"use client";

import "./boot.css";

import { useEffect, useState } from "react";

const BOOT_DURATION_MS = 3200; // matches the CSS sequence + fade-out
const SESSION_KEY = "zineos-booted";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const POST_LINES = [
  "ZINEOS BIOS v4.0.98  — (C) HAUNTED SYSTEMS",
  "Memory test ............ 640K OK",
  "Detecting holographic co-processor ... FOUND",
  "Mounting /dev/giphy ......... OK",
  "Loading window manager .......... OK",
];

type Phase = "pending" | "showing" | "done";

/**
 * The boot sequence — the money-shot first impression. Shows once per tab
 * session (so reloads don't nag), is click/key-skippable, and is fully bypassed
 * under reduced motion. The mount decision reads sessionStorage + matchMedia,
 * which only exist on the client, so the server always renders nothing.
 */
export function BootScreen() {
  const [phase, setPhase] = useState<Phase>("pending");

  useEffect(() => {
    const booted = sessionStorage.getItem(SESSION_KEY) === "1";
    const reduced = window.matchMedia(REDUCED_MOTION).matches;
    sessionStorage.setItem(SESSION_KEY, "1");

    if (booted || reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only first-paint decision
      setPhase("done");
      return;
    }
    setPhase("showing");
    const timer = setTimeout(() => setPhase("done"), BOOT_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (phase !== "showing") return null;

  return (
    <div
      className="boot"
      role="status"
      aria-label="Booting ZINEOS"
      onClick={() => setPhase("done")}
      onKeyDown={() => setPhase("done")}
      tabIndex={-1}
    >
      <div className="boot-inner">
        <pre className="boot-post">{POST_LINES.join("\n")}</pre>
        <h1 className="boot-logo holo-text">ZINEOS</h1>
        <p className="boot-tag">haunted operating system</p>
        <div className="boot-bar" aria-hidden="true">
          <span />
        </div>
        <p className="boot-hint">click to enter</p>
      </div>
    </div>
  );
}
