"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchStickerSearch } from "@/lib/giphy/search-client";
import type { SearchPayload } from "@/lib/giphy/schema";

/**
 * Infinite GIPHY sticker search. Caches per trimmed query, paginates via the
 * route's `nextOffset`, and only runs when there's a non-empty query. Returns
 * the raw infinite-query result so the grid can drive loading/empty/error and
 * fetch-next-page.
 */
export function useGiphySearch(query: string) {
  const q = query.trim();

  return useInfiniteQuery<SearchPayload>({
    queryKey: ["giphy", q],
    queryFn: ({ pageParam, signal }) =>
      fetchStickerSearch(q, pageParam as number, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: q.length > 0,
  });
}
