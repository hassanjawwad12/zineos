"use client";

import { Button } from "@/components/ui/Button";
import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import type { StudioActions } from "./types";

interface ToolbarProps {
  actions: StudioActions;
  url: string;
  onUrlChange: (value: string) => void;
  onAddUrl: () => void;
  busy: boolean;
}

/** The tool bar — the most-used actions as buttons, plus the no-API-key
 *  demo/paste fallbacks. Enable state tracks the live scene/selection. */
export function Toolbar({
  actions,
  url,
  onUrlChange,
  onAddUrl,
  busy,
}: ToolbarProps) {
  const hasNodes = useSceneStore((s) => s.order.length > 0);
  const hasSelection = useUiStore((s) => s.selectedId !== null);

  return (
    <div className="toolbar" role="toolbar" aria-label="Tools">
      <Button variant="primary" onClick={actions.openStickers}>
        🔍 Stickers
      </Button>
      <Button disabled={busy} onClick={actions.addDemo}>
        + Demo
      </Button>
      <input
        className="toolbar-input"
        placeholder="paste a giphy.com URL…"
        value={url}
        aria-label="GIPHY sticker URL"
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && url.trim()) onAddUrl();
        }}
      />
      <Button disabled={busy || !url.trim()} onClick={onAddUrl}>
        Add
      </Button>

      <span className="toolbar-sep" aria-hidden="true" />

      <Button disabled={!hasSelection} onClick={actions.duplicate}>
        Duplicate
      </Button>
      <Button disabled={!hasSelection} onClick={actions.remove}>
        Delete
      </Button>
      <Button onClick={actions.undo} title="Undo (⌘Z)">
        Undo
      </Button>
      <Button onClick={actions.redo} title="Redo (⇧⌘Z)">
        Redo
      </Button>

      <span className="toolbar-sep" aria-hidden="true" />

      <Button disabled={!hasNodes} onClick={actions.clear}>
        Clear
      </Button>

      <span className="toolbar-spacer" />

      <Button
        disabled={busy || !hasNodes}
        onClick={actions.exportPng}
      >
        Export PNG
      </Button>
      <Button
        variant="primary"
        disabled={busy || !hasNodes}
        onClick={actions.exportGif}
      >
        Export GIF
      </Button>
    </div>
  );
}
