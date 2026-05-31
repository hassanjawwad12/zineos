/**
 * Minimal ambient types for `gifuct-js` (ships no declarations). Covers only
 * the surface this project uses.
 */
declare module "gifuct-js" {
  export interface GifFrameDims {
    top: number;
    left: number;
    width: number;
    height: number;
  }

  export interface ParsedFrame {
    dims: GifFrameDims;
    /** Frame delay in milliseconds. */
    delay: number;
    /** GIF disposal method (0–3). */
    disposalType: number;
    /** Full RGBA pixels for this frame's dims rect (when buildImagePatch). */
    patch: Uint8ClampedArray;
    pixels: number[];
    colorTable: number[][];
    transparentIndex?: number;
  }

  export interface ParsedGif {
    lsd: { width: number; height: number };
    frames: unknown[];
  }

  export function parseGIF(data: ArrayBuffer | Uint8Array): ParsedGif;
  export function decompressFrames(
    gif: ParsedGif,
    buildImagePatch: boolean,
  ): ParsedFrame[];
  export function decompressFrame(
    frame: unknown,
    colorTable: number[][],
    buildImagePatch: boolean,
  ): ParsedFrame;
}
