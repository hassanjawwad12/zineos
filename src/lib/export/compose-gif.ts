import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrames, parseGIF } from "gifuct-js";

import type { Scene, StickerNode } from "@/lib/scene/types";

import { computeSceneBounds } from "./compose-canvas";

/**
 * Flatten an animated scene to a single looping GIF that matches what plays in
 * the studio.
 *
 * Pipeline:
 *   1. Decode each sticker's source GIF binary with `gifuct-js` into its real
 *      frames (+ per-frame delays and disposal methods).
 *   2. Coalesce each sticker's frames into full standalone frames, honoring GIF
 *      disposal (1 = leave, 2 = restore background, 3 = restore previous).
 *   3. Composite all stickers per output frame using the SAME transform math as
 *      the canvas/PNG export, sampling each sticker at its own loop position.
 *   4. Re-encode one animated GIF with `gifenc` (per-frame palette + 1-bit
 *      transparency).
 *
 * Same-origin proxied `src` keeps `fetch`/canvas read-back un-tainted. GIF only
 * carries 1-bit alpha, so anti-aliased edges may fringe slightly vs. the PNG —
 * inherent to the format.
 */

const EXPORT_PADDING = 32;
const MAX_EXPORT_DIM = 1024; // GIFs are heavy per pixel — cap tighter than PNG
const MAX_DURATION_MS = 6000; // bound file size + encode time
const MAX_FRAMES = 100;
const MIN_STEP_MS = 40; // ~25fps ceiling
const DEFAULT_FRAME_MS = 100;
const MIN_FRAME_MS = 20;

interface NodeAnimation {
  readonly frames: readonly ImageBitmap[];
  /** Cumulative end time (ms) of each frame; last entry === total. */
  readonly ends: readonly number[];
  readonly total: number;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Coalesce gifuct frames (which are patches) into full standalone frames. */
async function coalesceFrames(
  logicalWidth: number,
  logicalHeight: number,
  frames: ReturnType<typeof decompressFrames>,
): Promise<NodeAnimation> {
  const accum = createCanvas(logicalWidth, logicalHeight);
  const accumCtx = accum.getContext("2d", { willReadFrequently: true });
  const patch = createCanvas(logicalWidth, logicalHeight);
  const patchCtx = patch.getContext("2d");
  if (!accumCtx || !patchCtx) {
    throw new Error("Could not acquire 2D context for GIF decode");
  }

  const out: ImageBitmap[] = [];
  const ends: number[] = [];
  let elapsed = 0;
  let restorePoint: ImageData | null = null;

  for (const frame of frames) {
    const { dims, disposalType } = frame;

    // disposal 3 ("restore to previous") snapshots before drawing this frame.
    if (disposalType === 3) {
      restorePoint = accumCtx.getImageData(0, 0, logicalWidth, logicalHeight);
    }

    // Put this frame's patch into a scratch canvas, then composite it (with
    // alpha) over the accumulated frame at the patch's offset.
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.patch),
      dims.width,
      dims.height,
    );
    patchCtx.clearRect(0, 0, dims.width, dims.height);
    patchCtx.putImageData(imageData, 0, 0);
    accumCtx.drawImage(
      patch,
      0,
      0,
      dims.width,
      dims.height,
      dims.left,
      dims.top,
      dims.width,
      dims.height,
    );

    out.push(await createImageBitmap(accum));
    elapsed += Math.max(frame.delay || DEFAULT_FRAME_MS, MIN_FRAME_MS);
    ends.push(elapsed);

    // Prepare the accumulator for the NEXT frame per this frame's disposal.
    if (disposalType === 2) {
      accumCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
    } else if (disposalType === 3 && restorePoint) {
      accumCtx.putImageData(restorePoint, 0, 0);
    }
  }

  return { frames: out, ends, total: elapsed };
}

/** Decode one sticker into composited frames; static fallback on any failure. */
async function decodeNodeAnimation(src: string): Promise<NodeAnimation> {
  const res = await fetch(src);
  if (!res.ok) {
    throw new Error(`Failed to fetch sticker for GIF export: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();

  try {
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);
    if (frames.length > 0) {
      return await coalesceFrames(gif.lsd.width, gif.lsd.height, frames);
    }
  } catch {
    // Not a GIF (e.g. a pasted PNG) or decode failed — fall through to static.
  }

  const bitmap = await createImageBitmap(new Blob([buffer]));
  return { frames: [bitmap], ends: [DEFAULT_FRAME_MS], total: DEFAULT_FRAME_MS };
}

/** The frame an animation shows at time `t` (loops via modulo). */
function frameAt(anim: NodeAnimation, t: number): ImageBitmap {
  if (anim.frames.length === 1 || anim.total <= 0) return anim.frames[0]!;
  const local = t % anim.total;
  for (let i = 0; i < anim.ends.length; i++) {
    if (local < anim.ends[i]!) return anim.frames[i]!;
  }
  return anim.frames[anim.frames.length - 1]!;
}

function drawNodeFrame(
  ctx: CanvasRenderingContext2D,
  node: StickerNode,
  bitmap: ImageBitmap,
  originX: number,
  originY: number,
): void {
  const w = node.baseWidth * node.scaleX;
  const h = node.baseHeight * node.scaleY;
  ctx.save();
  ctx.translate(node.x - originX, node.y - originY);
  ctx.rotate(node.rotation);
  ctx.drawImage(bitmap, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Compose the scene into an animated GIF Blob. Throws on an empty scene. */
export async function composeSceneGif(scene: Scene): Promise<Blob> {
  const bounds = computeSceneBounds(scene);
  if (!bounds) {
    throw new Error("Cannot export an empty canvas");
  }

  const width = Math.min(
    Math.ceil(bounds.maxX - bounds.minX + EXPORT_PADDING * 2),
    MAX_EXPORT_DIM,
  );
  const height = Math.min(
    Math.ceil(bounds.maxY - bounds.minY + EXPORT_PADDING * 2),
    MAX_EXPORT_DIM,
  );
  const originX = bounds.minX - EXPORT_PADDING;
  const originY = bounds.minY - EXPORT_PADDING;

  const orderedNodes = scene.order
    .map((id) => scene.nodes[id])
    .filter((n): n is StickerNode => Boolean(n));

  const animations = await Promise.all(
    orderedNodes.map((node) => decodeNodeAnimation(node.src)),
  );

  // Output timeline: long enough for the slowest sticker's loop, capped, and
  // sampled at a step that keeps the frame count bounded.
  const longest = animations.reduce((m, a) => Math.max(m, a.total), 0);
  const duration = Math.min(longest || DEFAULT_FRAME_MS, MAX_DURATION_MS);
  const step = Math.max(MIN_STEP_MS, Math.ceil(duration / MAX_FRAMES));
  const frameCount = Math.max(1, Math.round(duration / step));

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  const gif = GIFEncoder();

  for (let k = 0; k < frameCount; k++) {
    const t = k * step;
    ctx.clearRect(0, 0, width, height);
    orderedNodes.forEach((node, i) => {
      const anim = animations[i];
      if (anim) drawNodeFrame(ctx, node, frameAt(anim, t), originX, originY);
    });

    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256, { format: "rgba4444" });
    const index = applyPalette(data, palette, "rgba4444");
    gif.writeFrame(index, width, height, {
      palette,
      delay: step,
      transparent: true,
      disposal: 2,
    });
  }

  gif.finish();

  for (const anim of animations) {
    for (const bmp of anim.frames) bmp.close();
  }

  // Copy into a fresh ArrayBuffer-backed view so it satisfies BlobPart.
  return new Blob([new Uint8Array(gif.bytes())], { type: "image/gif" });
}

/** Convenience: compose and trigger a browser download. */
export async function downloadSceneGif(
  scene: Scene,
  filename = "zineos-export.gif",
): Promise<void> {
  const blob = await composeSceneGif(scene);
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
