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
  readonly scale: number; // uniform scale factor over base size
  readonly rotation: number; // radians, clockwise
  readonly z: number; // stacking order (higher = front)
  readonly title: string; // sanitized, for a11y / export alt
}

/** A serializable scene: nodes keyed by id + explicit z-order. */
export interface Scene {
  readonly nodes: Record<string, StickerNode>;
  readonly order: readonly string[]; // ids, back → front
}
