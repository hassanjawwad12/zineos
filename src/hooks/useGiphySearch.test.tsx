import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useGiphySearch } from "./useGiphySearch";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function mockFetch(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(payload),
      }),
    ),
  );
}

describe("useGiphySearch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not fetch for an empty query", () => {
    mockFetch({ results: [], nextOffset: null, total: 0 });
    const { result } = renderHook(() => useGiphySearch("   "), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches and exposes results for a non-empty query", async () => {
    mockFetch({
      results: [{ id: "1", src: "/p", width: 100, height: 80, title: "t" }],
      nextOffset: 24,
      total: 100,
    });
    const { result } = renderHook(() => useGiphySearch("cats"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.results).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("reports no next page when nextOffset is null", async () => {
    mockFetch({ results: [], nextOffset: null, total: 0 });
    const { result } = renderHook(() => useGiphySearch("zzz"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});
