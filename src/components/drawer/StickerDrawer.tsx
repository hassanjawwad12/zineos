"use client";

import "./drawer.css";

import { useRef, useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useGiphySearch } from "@/hooks/useGiphySearch";
import type { StickerResult as StickerResultData } from "@/lib/giphy/schema";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import { SearchBar } from "./SearchBar";
import { StickerGrid } from "./StickerGrid";

const PRESETS = [
  "win98",
  "pixel art",
  "blinkies",
  "vaporwave",
  "y2k",
  "holographic",
  "sparkles",
] as const;

const SEARCH_DEBOUNCE_MS = 300;

/**
 * The sticker search drawer. A focus-managed dialog (full focus-trap lands in
 * Phase 8) that searches GIPHY, lists results with infinite scroll, and adds a
 * picked sticker to the canvas. GIPHY attribution is shown per their API terms.
 */
export function StickerDrawer() {
  const open = useUiStore((s) => s.drawerOpen);
  const setOpen = useUiStore((s) => s.setDrawerOpen);
  const select = useUiStore((s) => s.select);
  const add = useSceneStore((s) => s.add);

  const [input, setInput] = useState("");
  const debounced = useDebounce(input, SEARCH_DEBOUNCE_MS);
  const trimmed = debounced.trim();
  const search = useGiphySearch(trimmed);

  const drawerRef = useRef<HTMLElement>(null);
  useFocusTrap(drawerRef, open);

  if (!open) return null;

  function handlePick(result: StickerResultData) {
    const count = useSceneStore.getState().order.length;
    const id = add({
      giphyId: result.id,
      src: result.src,
      baseWidth: result.width,
      baseHeight: result.height,
      title: result.title || "sticker",
      // Scatter additions so they don't stack perfectly.
      x: (Math.sin(count * 1.7) * 70) | 0,
      y: (Math.cos(count * 2.3) * 70) | 0,
    });
    select(id);
  }

  return (
    <div
      className="drawer-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <section
        ref={drawerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Sticker search"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <header className="drawer-titlebar">
          <span>Stickers</span>
          <button
            type="button"
            className="drawer-close"
            aria-label="Close sticker search"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </header>

        <SearchBar value={input} onChange={setInput} presets={PRESETS} />

        <div className="drawer-body">
          <StickerGrid query={trimmed} search={search} onPick={handlePick} />
        </div>

        <footer className="drawer-footer">Powered By GIPHY</footer>
      </section>
    </div>
  );
}
