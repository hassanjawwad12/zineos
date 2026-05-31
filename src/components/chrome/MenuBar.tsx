"use client";

import { useSceneStore } from "@/store/useSceneStore";
import { useUiStore } from "@/store/useUiStore";

import { Menu, MENU_SEP, type MenuItemDef } from "./Menu";
import type { StudioActions } from "./types";

const mod = "⌘";

/**
 * The OS menu bar. File / Edit / View / Help, each a real dropdown wired to the
 * studio actions. Disable state reflects the live scene/selection.
 */
export function MenuBar({ actions }: { actions: StudioActions }) {
  const hasNodes = useSceneStore((s) => s.order.length > 0);
  const hasSelection = useUiStore((s) => s.selectedId !== null);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const soundEnabled = useUiStore((s) => s.soundEnabled);
  const toggleSound = useUiStore((s) => s.toggleSound);

  const file: (MenuItemDef | typeof MENU_SEP)[] = [
    { label: "Browse stickers…", onSelect: actions.openStickers },
    MENU_SEP,
    {
      label: "Export PNG",
      onSelect: actions.exportPng,
      disabled: !hasNodes,
    },
    {
      label: "Export GIF (animated)",
      onSelect: actions.exportGif,
      disabled: !hasNodes,
    },
    MENU_SEP,
    { label: "Clear canvas", onSelect: actions.clear, disabled: !hasNodes },
  ];

  const edit: (MenuItemDef | typeof MENU_SEP)[] = [
    { label: "Undo", onSelect: actions.undo, shortcut: `${mod}Z` },
    { label: "Redo", onSelect: actions.redo, shortcut: `⇧${mod}Z` },
    MENU_SEP,
    {
      label: "Duplicate",
      onSelect: actions.duplicate,
      shortcut: `${mod}D`,
      disabled: !hasSelection,
    },
    {
      label: "Delete",
      onSelect: actions.remove,
      shortcut: "Del",
      disabled: !hasSelection,
    },
  ];

  const view: (MenuItemDef | typeof MENU_SEP)[] = [
    {
      label: drawerOpen ? "Hide sticker drawer" : "Show sticker drawer",
      onSelect: actions.openStickers,
    },
    MENU_SEP,
    {
      label: soundEnabled ? "Sound: on" : "Sound: off",
      onSelect: toggleSound,
    },
  ];

  const help: (MenuItemDef | typeof MENU_SEP)[] = [
    { label: "About ZINEOS", onSelect: actions.about },
  ];

  return (
    <nav className="menubar" aria-label="Main menu">
      <span className="menubar-brand holo-text">ZINEOS</span>
      <Menu label="File" items={file} />
      <Menu label="Edit" items={edit} />
      <Menu label="View" items={view} />
      <Menu label="Help" items={help} />
    </nav>
  );
}
