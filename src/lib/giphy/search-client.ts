import type { SearchPayload } from "./schema";

/**
 * Client-side fetch against our own search route. The route already validates,
 * trims, and proxies — so the client trusts its shape but still fails loudly on
 * a non-ok response (TanStack Query maps the throw to an error state).
 */
export async function fetchStickerSearch(
  query: string,
  offset: number,
  signal?: AbortSignal,
): Promise<SearchPayload> {
  const params = new URLSearchParams({ q: query, offset: String(offset) });
  const res = await fetch(`/api/giphy/search?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`Sticker search failed (${res.status})`);
  }
  return (await res.json()) as SearchPayload;
}
