"use client";

import "./studio.css";
import "@/components/chrome/chrome.css";

import { useState } from "react";

import { LiveRegion } from "@/components/a11y/LiveRegion";
import { BootScreen } from "@/components/boot/BootScreen";
import { CRTOverlay } from "@/components/boot/CRTOverlay";
import { Canvas } from "@/components/canvas/Canvas";
import { AboutDialog } from "@/components/chrome/AboutDialog";
import { MenuBar } from "@/components/chrome/MenuBar";
import { StatusBar } from "@/components/chrome/StatusBar";
import { Taskbar } from "@/components/chrome/Taskbar";
import { Toolbar } from "@/components/chrome/Toolbar";
import type { StudioActions } from "@/components/chrome/types";
import { StickerDrawer } from "@/components/drawer/StickerDrawer";
import { LayersPanel } from "@/components/layers/LayersPanel";
import { useAutosave } from "@/hooks/useAutosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useStudioFeedback } from "@/hooks/useStudioFeedback";
import { parseAllowedGiphyUrl } from "@/lib/giphy/ssrf";
import { toProxiedUrl } from "@/lib/giphy/url";
import {
  buildShareUrl,
  encodeSceneToParam,
  SHARE_PARAM,
} from "@/lib/scene/share-url";
import { getSceneSnapshot, useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * The OS shell: boot screen → menu bar · tool bar · [desktop: canvas + sticker
 * window] · layers window · status bar · taskbar, all under a CRT overlay.
 * Chrome stays strictly mono-gray + OS blue; all color lives on the canvas.
 *
 * Studio owns the cross-cutting handlers (proxy add, export, share) and hands a
 * single `actions` object to the menu/tool bars.
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
  useAutosave();
  useStudioFeedback();

  const add = useSceneStore((s) => s.add);
  const clear = useSceneStore((s) => s.clear);
  const remove = useSceneStore((s) => s.remove);
  const duplicate = useSceneStore((s) => s.duplicate);
  const select = useUiStore((s) => s.select);
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("ready");
  const [busy, setBusy] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  function handleDelete() {
    const id = useUiStore.getState().selectedId;
    if (!id) return;
    remove(id);
    select(null);
  }

  function handleDuplicate() {
    const id = useUiStore.getState().selectedId;
    if (!id) return;
    const newId = duplicate(id);
    if (newId) select(newId);
  }

  function handleShare() {
    const scene = getSceneSnapshot();
    const base = window.location.origin + window.location.pathname;
    const shareUrl = buildShareUrl(scene, base);
    window.history.replaceState(
      null,
      "",
      `?${SHARE_PARAM}=${encodeSceneToParam(scene)}`,
    );
    const copy = navigator.clipboard?.writeText(shareUrl);
    if (copy) {
      copy.then(
        () => setStatus("share link copied to clipboard ✓"),
        () => setStatus("share link is in the address bar"),
      );
    } else {
      setStatus("share link is in the address bar");
    }
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
      const count = useSceneStore.getState().order.length;
      const id = add({
        giphyId: allowed.pathname,
        src,
        baseWidth: width,
        baseHeight: height,
        title: "sticker",
        x: (Math.sin(count * 1.7) * 60) | 0,
        y: (Math.cos(count * 2.3) * 60) | 0,
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
    if (useSceneStore.getState().order.length === 0) {
      setStatus("nothing to export");
      return;
    }
    setBusy(true);
    setStatus("compositing png…");
    try {
      // Dynamic import: the export module only loads when first used.
      const { downloadScenePng } = await import("@/lib/export/compose-canvas");
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

  const actions: StudioActions = {
    openStickers: () => setDrawerOpen(!useUiStore.getState().drawerOpen),
    addDemo: () => addFromRawUrl(DEMO_STICKER_URL),
    duplicate: handleDuplicate,
    remove: handleDelete,
    undo: () => useSceneStore.temporal.getState().undo(),
    redo: () => useSceneStore.temporal.getState().redo(),
    clear,
    share: handleShare,
    exportPng: handleExport,
    about: () => setAboutOpen(true),
  };

  return (
    <div className="studio">
      <MenuBar actions={actions} />
      <Toolbar
        actions={actions}
        url={url}
        onUrlChange={setUrl}
        onAddUrl={() => addFromRawUrl(url.trim())}
        busy={busy}
      />
      <div className="studio-body">
        <div className="studio-canvas-wrap">
          <Canvas />
          <StickerDrawer />
        </div>
        <LayersPanel />
      </div>
      <StatusBar message={status} />
      <Taskbar onStart={() => setAboutOpen(true)} />

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <LiveRegion />
      <CRTOverlay />
      <BootScreen />
    </div>
  );
}
