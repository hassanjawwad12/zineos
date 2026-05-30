import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchStickerSearch } from "./search-client";

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({ ok, status, json: () => Promise.resolve(body) }),
    ),
  );
}

describe("fetchStickerSearch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests the search route with q and offset", async () => {
    mockFetch({ results: [], nextOffset: null, total: 0 });
    await fetchStickerSearch("cats", 24);
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/giphy/search?");
    expect(url).toContain("q=cats");
    expect(url).toContain("offset=24");
  });

  it("returns the parsed payload on success", async () => {
    const payload = {
      results: [{ id: "1", src: "/p", width: 100, height: 80, title: "t" }],
      nextOffset: 24,
      total: 100,
    };
    mockFetch(payload);
    const result = await fetchStickerSearch("cats", 0);
    expect(result).toEqual(payload);
  });

  it("throws on a non-ok response", async () => {
    mockFetch({}, false, 502);
    await expect(fetchStickerSearch("cats", 0)).rejects.toThrow(/502/);
  });
});
