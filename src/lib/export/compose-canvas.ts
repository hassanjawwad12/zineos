import type { Scene, StickerNode } from "@/lib/scene/types";
import { rotatedAABB } from "@/lib/transform/geometry";

/**
 * Flatten a scene to a PNG by manual canvas compositing — no html2canvas.
 * For each node (back → front) we set the canvas transform to match the node's
 * translate/rotate/scale and drawImage at its base size, centered on origin.
 *
 * This works WITHOUT tainting the output canvas because every sticker `src` is
 * same-origin (proxied through /api/giphy/image). That is the whole point of
 * the proxy: `toBlob`/`toDataURL` would throw a SecurityError on a tainted
 * canvas, so same-origin images are what make export possible at all.
 */

const EXPORT_PADDING = 32; // px breathing room around the zine bounds
const MAX_EXPORT_DIM = 4096; // guard against pathological scenes

export interface ComposeOptions {
  /** Optional background painter; default leaves transparency. */
  readonly background?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => void;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Tight bounds of all nodes' rotated AABBs, or null for an empty scene. */
export function computeSceneBounds(scene: Scene): Bounds | null {
  const ids = scene.order;
  if (ids.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const id of ids) {
    const node = scene.nodes[id];
    if (!node) continue;
    const box = rotatedAABB(node);
    minX = Math.min(minX, box.minX);
    minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX);
    maxY = Math.max(maxY, box.maxY);
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin proxy means we never actually need CORS, but requesting it
    // is harmless and keeps the canvas explicitly clean.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: StickerNode,
  img: HTMLImageElement,
  originX: number,
  originY: number,
): void {
  const w = node.baseWidth * node.scale;
  const h = node.baseHeight * node.scale;

  ctx.save();
  // Translate to the node center in export space, rotate, then draw centered.
  ctx.translate(node.x - originX, node.y - originY);
  ctx.rotate(node.rotation);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/**
 * Composite the scene into an offscreen canvas and return a PNG Blob.
 * Animated GIFs composite as a single (first) frame — a static PNG snapshot is
 * the documented, in-scope behavior. Throws if the scene is empty or if
 * `toBlob` fails (which would indicate a tainted canvas — the bug this whole
 * proxy architecture exists to prevent).
 */
export async function composeScenePng(
  scene: Scene,
  options: ComposeOptions = {},
): Promise<Blob> {
  const bounds = computeSceneBounds(scene);
  if (!bounds) {
    throw new Error("Cannot export an empty canvas");
  }

  const rawWidth = bounds.maxX - bounds.minX + EXPORT_PADDING * 2;
  const rawHeight = bounds.maxY - bounds.minY + EXPORT_PADDING * 2;
  const width = Math.min(Math.ceil(rawWidth), MAX_EXPORT_DIM);
  const height = Math.min(Math.ceil(rawHeight), MAX_EXPORT_DIM);

  const originX = bounds.minX - EXPORT_PADDING;
  const originY = bounds.minY - EXPORT_PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  options.background?.(ctx, width, height);

  // Load all images first (in z-order), then composite synchronously.
  const orderedNodes = scene.order
    .map((id) => scene.nodes[id])
    .filter((n): n is StickerNode => Boolean(n));

  const images = await Promise.all(
    orderedNodes.map((node) => loadImage(node.src)),
  );

  orderedNodes.forEach((node, i) => {
    const img = images[i];
    if (img) drawNode(ctx, node, img, originX, originY);
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed (possibly tainted)"));
    }, "image/png");
  });
}

/** Convenience: compose and trigger a browser download. */
export async function downloadScenePng(
  scene: Scene,
  filename = "zineos-export.png",
  options: ComposeOptions = {},
): Promise<void> {
  const blob = await composeScenePng(scene, options);
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
