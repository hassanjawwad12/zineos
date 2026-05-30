"use client";

import "./studio.css";

import { useState } from "react";

import { Canvas } from "@/components/canvas/Canvas";
import { StickerDrawer } from "@/components/drawer/StickerDrawer";
import { LayersPanel } from "@/components/layers/LayersPanel";
import { Button } from "@/components/ui/Button";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toProxiedUrl } from "@/lib/giphy/url";
import { parseAllowedGiphyUrl } from "@/lib/giphy/ssrf";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * Studio shell: toolbar + canvas + Layers panel, with the GIPHY sticker drawer
 * overlaying when opened. The demo-sticker / paste-URL controls remain as a
 * no-API-key fallback for the proxy; the chrome gets its full OS treatment in
 * Phase 7.
 */

// A stable, public GIPHY transparent sticker (no API key needed to fetch media).
const DEMO_STICKER_URL =
  "https://media.giphy.com/media/3o7TKsQ8UQ0Mce14sM/giphy.gif";

interface Probe {
  width: number;
  height: number;
}

/** Read natural dimensions of a (proxied) image before adding it. */
function probeImage(src: string): Promise<Probe> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () =>
      resolve({
        width: img.naturalWidth || 200,
        height: img.naturalHeight || 200,
      });
    img.onerror = () => reject(new Error("Image failed to load through proxy"));
    img.src = src;
  });
}

export function Studio() {
  useKeyboardShortcuts();

  const add = useSceneStore((s) => s.add);
  const clear = useSceneStore((s) => s.clear);
  const remove = useSceneStore((s) => s.remove);
  const duplicate = useSceneStore((s) => s.duplicate);
  const order = useSceneStore((s) => s.order);
  const selectedId = useUiStore((s) => s.selectedId);
  const select = useUiStore((s) => s.select);
  const toggleDrawer = useUiStore((s) => s.toggleDrawer);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("ready");
  const [busy, setBusy] = useState(false);

  function handleDelete() {
    if (!selectedId) return;
    remove(selectedId);
    select(null);
  }

  function handleDuplicate() {
    if (!selectedId) return;
    const newId = duplicate(selectedId);
    if (newId) select(newId);
  }

  function undo() {
    useSceneStore.temporal.getState().undo();
  }

  function redo() {
    useSceneStore.temporal.getState().redo();
  }

  async function addFromRawUrl(rawUrl: string) {
    const allowed = parseAllowedGiphyUrl(rawUrl);
    if (!allowed) {
      setStatus("rejected: not a giphy media url");
      return;
    }
    setBusy(true);
    setStatus("loading through proxy…");
    const src = toProxiedUrl(allowed.toString());
    try {
      const { width, height } = await probeImage(src);
      const id = add({
        giphyId: allowed.pathname,
        src,
        baseWidth: width,
        baseHeight: height,
        title: "sticker",
        // light jitter so stacked adds don't perfectly overlap
        x: (Math.sin(order.length * 1.7) * 60) | 0,
        y: (Math.cos(order.length * 2.3) * 60) | 0,
      });
      select(id);
      setStatus(`added (${width}×${height})`);
    } catch {
      setStatus("error: proxy/image load failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    if (order.length === 0) {
      setStatus("nothing to export");
      return;
    }
    setBusy(true);
    setStatus("compositing png…");
    try {
      // Dynamic import: the export module only loads when first used.
      const { downloadScenePng } = await import("@/lib/export/compose-canvas");
      const { getSceneSnapshot } = await import("@/store/useSceneStore");
      await downloadScenePng(getSceneSnapshot());
      setStatus("exported ✓ (canvas not tainted)");
    } catch (err) {
      setStatus(
        `export failed: ${err instanceof Error ? err.message : "unknown"}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio">
      <header
        className="studio-toolbar"
        role="toolbar"
        aria-label="Studio controls"
      >
        <span className="brand">ZINEOS</span>
        <Button variant="primary" onClick={toggleDrawer}>
          🔍 Stickers
        </Button>
        <Button disabled={busy} onClick={() => addFromRawUrl(DEMO_STICKER_URL)}>
          + Demo sticker
        </Button>
        <input
          className="studio-url-input"
          placeholder="paste a giphy.com sticker URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="GIPHY sticker URL"
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) addFromRawUrl(url.trim());
          }}
        />
        <Button
          disabled={busy || !url.trim()}
          onClick={() => addFromRawUrl(url.trim())}
        >
          Add URL
        </Button>
        <Button
          disabled={busy || selectedId === null}
          onClick={handleDuplicate}
        >
          Duplicate
        </Button>
        <Button disabled={busy || selectedId === null} onClick={handleDelete}>
          Delete
        </Button>
        <Button disabled={busy} onClick={undo} title="Undo (⌘Z)">
          Undo
        </Button>
        <Button disabled={busy} onClick={redo} title="Redo (⇧⌘Z)">
          Redo
        </Button>
        <Button disabled={busy || order.length === 0} onClick={() => clear()}>
          Clear
        </Button>
        <Button
          variant="primary"
          disabled={busy || order.length === 0}
          onClick={handleExport}
        >
          Export PNG
        </Button>
        <span className="studio-status" role="status" aria-live="polite">
          {status}
        </span>
      </header>
      <div className="studio-body">
        <div className="studio-canvas-wrap">
          <Canvas />
          <StickerDrawer />
        </div>
        <LayersPanel />
      </div>
    </div>
  );
}
