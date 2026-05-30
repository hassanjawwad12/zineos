import "server-only";

import {
  GiphyResponseSchema,
  MAX_LIMIT,
  type SearchParams,
  type SearchPayload,
  type StickerResult,
} from "./schema";
import { toProxiedUrl } from "./url";

/**
 * Server-only GIPHY access. The API key is read from a non-public env var and
 * never crosses to the client. Callers (route handlers) pass already-validated
 * params. Throws GiphyError on any failure so the route can map it to a status.
 */

const GIPHY_SEARCH_ENDPOINT = "https://api.giphy.com/v1/stickers/search";

export class GiphyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GiphyError";
  }
}

function getApiKey(): string {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    // Fail fast with a server-side message; never leak this to the client body.
    throw new GiphyError("GIPHY_API_KEY is not configured", 500);
  }
  return key;
}

export async function searchStickers(
  params: SearchParams,
): Promise<SearchPayload> {
  const url = new URL(GIPHY_SEARCH_ENDPOINT);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("q", params.q);
  url.searchParams.set("limit", String(MAX_LIMIT));
  url.searchParams.set("offset", String(params.offset));
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("bundle", "fixed_width_transparent");

  let res: Response;
  try {
    res = await fetch(url, {
      // Cache identical upstream queries briefly at the edge.
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new GiphyError("Failed to reach GIPHY", 502);
  }

  if (!res.ok) {
    throw new GiphyError(`GIPHY responded ${res.status}`, 502);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new GiphyError("GIPHY returned invalid JSON", 502);
  }

  const parsed = GiphyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new GiphyError("GIPHY response failed validation", 502);
  }

  const { data, pagination } = parsed.data;

  const results: StickerResult[] = data.map((gif) => {
    const rendition = gif.images.fixed_width;
    return {
      id: gif.id,
      src: toProxiedUrl(rendition.url),
      width: rendition.width,
      height: rendition.height,
      title: gif.title,
    };
  });

  const consumed = pagination.offset + pagination.count;
  const nextOffset =
    consumed < pagination.total_count && results.length > 0 ? consumed : null;

  return { results, nextOffset, total: pagination.total_count };
}
