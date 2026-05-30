import { create } from "zustand";

/**
 * Transient UI state — selection, active tool, drawer visibility. Deliberately
 * NOT persisted and NOT in undo/redo history (per the state model in the plan).
 */

export type Tool = "select";

export interface UiState {
  selectedId: string | null;
  drawerOpen: boolean;
  tool: Tool;
  soundEnabled: boolean;

  select: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setTool: (tool: Tool) => void;
  toggleSound: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedId: null,
  drawerOpen: false,
  tool: "select",
  soundEnabled: true,

  select: (id) => set({ selectedId: id }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
  setTool: (tool) => set({ tool }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
}));
