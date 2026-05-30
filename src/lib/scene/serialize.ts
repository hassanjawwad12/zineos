import { z } from "zod";

import type { Scene, StickerNode } from "./types";

/**
 * Scene (de)serialization for share URLs and storage. The wire form is an
 * ordered array (back → front) of short-keyed node tuples — `order` and per-node
 * `z` are implicit in array position, which keeps the payload (and the eventual
 * compressed URL) small.
 *
 * Deserialization is a TRUST BOUNDARY: a share URL is attacker-controllable, so
 * every field is zod-validated and clamped, and `src` MUST be our same-origin
 * image-proxy path (never an arbitrary URL the victim's browser would fetch).
 * Invalid nodes are dropped rather than failing the whole scene.
 */

const PROXY_PREFIX = "/api/giphy/image?u=";
const COORD_LIMIT = 100_000;
const TITLE_MAX = 200;

/** Strip control characters and clamp length — title is rendered + exported. */
function sanitizeTitle(raw: string): string {
  return raw.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, TITLE_MAX);
}

const SerializedNodeSchema = z.object({
  id: z.string().min(1).max(64),
  g: z.string().max(128), // giphyId
  s: z.string().max(2000).startsWith(PROXY_PREFIX), // proxied src only
  bw: z.number().positive().max(10_000), // baseWidth
  bh: z.number().positive().max(10_000), // baseHeight
  x: z.number().min(-COORD_LIMIT).max(COORD_LIMIT),
  y: z.number().min(-COORD_LIMIT).max(COORD_LIMIT),
  sx: z.number().positive().max(100), // scaleX
  sy: z.number().positive().max(100), // scaleY
  r: z.number().min(-100).max(100), // rotation (radians)
  t: z.string().max(TITLE_MAX * 2), // title (sanitized below)
});

type SerializedNode = z.infer<typeof SerializedNodeSchema>;

function toSerialized(node: StickerNode): SerializedNode {
  return {
    id: node.id,
    g: node.giphyId,
    s: node.src,
    bw: node.baseWidth,
    bh: node.baseHeight,
    x: node.x,
    y: node.y,
    sx: node.scaleX,
    sy: node.scaleY,
    r: node.rotation,
    t: node.title,
  };
}

function fromSerialized(node: SerializedNode, z: number): StickerNode {
  return {
    id: node.id,
    giphyId: node.g,
    src: node.s,
    baseWidth: node.bw,
    baseHeight: node.bh,
    x: node.x,
    y: node.y,
    scaleX: node.sx,
    scaleY: node.sy,
    rotation: node.r,
    z,
    title: sanitizeTitle(node.t),
  };
}

/** Serialize a scene to a compact JSON string (ordered back → front). */
export function serializeScene(scene: Scene): string {
  const arr = scene.order
    .map((id) => scene.nodes[id])
    .filter((n): n is StickerNode => Boolean(n))
    .map(toSerialized);
  return JSON.stringify(arr);
}

/**
 * Parse a serialized scene. Returns null only when the top-level structure is
 * unusable; individual invalid nodes are dropped (resilient partial load).
 */
export function deserializeScene(text: string): Scene | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;

  const nodes: Record<string, StickerNode> = {};
  const order: string[] = [];
  for (const item of raw) {
    const parsed = SerializedNodeSchema.safeParse(item);
    if (!parsed.success) continue;
    if (nodes[parsed.data.id]) continue; // drop duplicate ids
    const node = fromSerialized(parsed.data, order.length);
    nodes[node.id] = node;
    order.push(node.id);
  }

  return { nodes, order };
}
