"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";
import type { useGiphySearch } from "@/hooks/useGiphySearch";
import type { StickerResult as StickerResultData } from "@/lib/giphy/schema";

import { StickerResult } from "./StickerResult";

interface StickerGridProps {
  query: string; // trimmed; "" means idle (no search yet)
  search: ReturnType<typeof useGiphySearch>;
  onPick: (result: StickerResultData) => void;
}

/**
 * Renders every search state — idle, loading, error, empty, results — and
 * drives infinite scroll via an IntersectionObserver sentinel. Results across
 * pages are flattened; keys are page-position-qualified because GIPHY can
 * return the same id on different pages.
 */
export function StickerGrid({ query, search, onPick }: StickerGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    data,
    isError,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = search;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!query) {
    return (
      <p className="drawer-state">
        Search GIPHY for stickers — or tap a preset above.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="drawer-state" role="status">
        Loading stickers…
      </p>
    );
  }

  if (isError) {
    return (
      <div className="drawer-state drawer-state--error" role="alert">
        <p>Couldn’t load stickers.</p>
        <Button onClick={() => void refetch()}>Retry</Button>
        {error instanceof Error && (
          <p className="drawer-more">{error.message}</p>
        )}
      </div>
    );
  }

  const results = data?.pages.flatMap((page) => page.results) ?? [];

  if (results.length === 0) {
    return <p className="drawer-state">No stickers found for “{query}”.</p>;
  }

  return (
    <>
      <div className="sticker-grid">
        {results.map((result, index) => (
          <StickerResult
            key={`${result.id}-${index}`}
            result={result}
            onPick={onPick}
          />
        ))}
      </div>
      {hasNextPage && (
        <div ref={sentinelRef} className="drawer-sentinel" aria-hidden="true" />
      )}
      {isFetchingNextPage && <p className="drawer-more">Loading more…</p>}
    </>
  );
}
