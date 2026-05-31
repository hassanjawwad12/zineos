/**
 * Minimal ambient types for `gifenc` (ships no declarations). Covers only the
 * surface this project uses; see the gifenc README for the full API.
 */
declare module "gifenc" {
  export type GifencFormat = "rgb565" | "rgb444" | "rgba4444";

  export interface WriteFrameOpts {
    palette?: number[][];
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    /** GIF disposal method (0–3). */
    disposal?: number;
    repeat?: number;
    first?: boolean;
  }

  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOpts,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }

  export function GIFEncoder(opts?: {
    auto?: boolean;
    initialCapacity?: number;
  }): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: {
      format?: GifencFormat;
      oneBitAlpha?: boolean | number;
      clearAlpha?: boolean;
    },
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: GifencFormat,
  ): Uint8Array;
}
