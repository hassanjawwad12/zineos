"use client";

import type { StickerResult as StickerResultData } from "@/lib/giphy/schema";

interface StickerResultProps {
  result: StickerResultData;
  onPick: (result: StickerResultData) => void;
}

/** A single search result. Explicit width/height on the image avoids layout
 *  shift; the proxied src keeps it same-origin (and export-safe). */
export function StickerResult({ result, onPick }: StickerResultProps) {
  return (
    <button
      type="button"
      className="sticker-result"
      onClick={() => onPick(result)}
      title={result.title || "Add sticker"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- proxied GIPHY media */}
      <img
        src={result.src}
        alt={result.title || "sticker"}
        width={result.width}
        height={result.height}
        loading="lazy"
        draggable={false}
      />
    </button>
  );
}
