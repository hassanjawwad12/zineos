/** Studio-level actions shared by the menu bar and tool bar. */
export interface StudioActions {
  openStickers: () => void;
  addDemo: () => void;
  duplicate: () => void;
  remove: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  exportPng: () => void;
  exportGif: () => void;
  about: () => void;
}
