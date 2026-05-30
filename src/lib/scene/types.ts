/**
 * The scene graph. Each sticker is an immutable node. Transform is stored as
 * center position + uniform scale + rotation (NOT top/left + width), because
 * rotation and scale are intuitive about a center — and the rotate/resize math
 * in lib/transform is far cleaner in this representation.
 */
export interface StickerNode {
  readonly id: string;
  readonly giphyId: string;
  readonly src: string; // proxied URL (same-origin → export-safe)
  readonly baseWidth: number; // natural px (rendition width)
  readonly baseHeight: number; // natural px (rendition height)
  readonly x: number; // center, canvas coords
  readonly y: number; // center, canvas coords
  // Independent local-frame scale factors over the base size. Stored separately
  // (not a single uniform scale) so resize handles can stretch one axis and the
  // aspect-lock modifier is a real toggle, not the only mode.
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotation: number; // radians, clockwise
  readonly z: number; // stacking order (higher = front)
  readonly title: string; // sanitized, for a11y / export alt
}

/** A serializable scene: nodes keyed by id + explicit z-order. */
export interface Scene {
  readonly nodes: Record<string, StickerNode>;
  readonly order: readonly string[]; // ids, back → front
}
