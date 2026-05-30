import { z } from "zod";

/**
 * Validation at the GIPHY boundary. We never trust GIPHY's raw shape; we parse
 * the slice we need and reject anything malformed. Query params are clamped so
 * a caller can't drive huge offsets/limits through our proxy.
 */

export const MAX_LIMIT = 24;
export const MAX_OFFSET = 4999; // GIPHY hard-caps pagination near 5000

/** Incoming query params for /api/giphy/search. */
export const SearchParamsSchema = z.object({
  q: z.string().trim().min(1).max(80),
  offset: z.coerce.number().int().min(0).max(MAX_OFFSET).default(0),
});
export type SearchParams = z.infer<typeof SearchParamsSchema>;

/** The single rendition we pull from each GIPHY result. */
const RenditionSchema = z.object({
  url: z.string().url(),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
});

/** Only the fields we actually read off a GIPHY GIF object. */
const GiphyGifSchema = z.object({
  id: z.string().min(1),
  title: z.string().default(""),
  images: z.object({
    // transparent sticker rendition, falls back to fixed_width if absent
    fixed_width: RenditionSchema,
    original: RenditionSchema.optional(),
  }),
});

export const GiphyResponseSchema = z.object({
  data: z.array(GiphyGifSchema),
  pagination: z.object({
    total_count: z.coerce.number().int().nonnegative(),
    count: z.coerce.number().int().nonnegative(),
    offset: z.coerce.number().int().nonnegative(),
  }),
});
export type GiphyResponse = z.infer<typeof GiphyResponseSchema>;

/** Trimmed payload we send to the client — no raw GIPHY surface leaks through. */
export interface StickerResult {
  readonly id: string;
  readonly src: string; // proxied, same-origin URL
  readonly width: number;
  readonly height: number;
  readonly title: string;
}

export interface SearchPayload {
  readonly results: StickerResult[];
  readonly nextOffset: number | null; // null when no more pages
  readonly total: number;
}
