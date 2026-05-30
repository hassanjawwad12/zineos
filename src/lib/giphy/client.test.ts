import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GiphyError, searchStickers } from "./client";

/** Minimal GIPHY response builder for the fields our schema reads. */
function giphyJson(count: number, { offset = 0, total = 100 } = {}): unknown {
  return {
    data: Array.from({ length: count }, (_, i) => ({
      id: `id${i}`,
      title: `title ${i}`,
      images: {
        fixed_width: {
          url: `https://media.giphy.com/media/id${i}/giphy.gif`,
          width: "200",
          height: "150",
        },
      },
    })),
    pagination: { total_count: total, count, offset },
  };
}

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  const res = {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(res)),
  );
}

describe("searchStickers", () => {
  beforeEach(() => {
    vi.stubEnv("GIPHY_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("maps GIPHY results to proxied, trimmed stickers", async () => {
    mockFetchOnce(giphyJson(2));
    const payload = await searchStickers({ q: "cat", offset: 0 });

    expect(payload.results).toHaveLength(2);
    expect(payload.results[0]?.src).toContain("/api/giphy/image?u=");
    expect(payload.results[0]?.width).toBe(200);
    expect(payload.results[0]?.title).toBe("title 0");
    // The raw GIPHY media URL must NOT leak directly to the client.
    expect(payload.results[0]?.src).not.toContain("media.giphy.com/media");
  });

  it("computes nextOffset while more pages remain", async () => {
    mockFetchOnce(giphyJson(24, { offset: 0, total: 100 }));
    const payload = await searchStickers({ q: "cat", offset: 0 });
    expect(payload.nextOffset).toBe(24);
    expect(payload.total).toBe(100);
  });

  it("returns null nextOffset on the last page", async () => {
    mockFetchOnce(giphyJson(10, { offset: 90, total: 100 }));
    const payload = await searchStickers({ q: "cat", offset: 90 });
    expect(payload.nextOffset).toBeNull();
  });

  it("sends the api key to GIPHY but never returns it", async () => {
    mockFetchOnce(giphyJson(1));
    await searchStickers({ q: "cat", offset: 0 });
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as URL;
    expect(url.searchParams.get("api_key")).toBe("test-key");
  });

  it("throws GiphyError(500) when the key is missing", async () => {
    vi.stubEnv("GIPHY_API_KEY", "");
    mockFetchOnce(giphyJson(1));
    await expect(searchStickers({ q: "cat", offset: 0 })).rejects.toThrow(
      GiphyError,
    );
  });

  it("throws GiphyError(502) on a non-ok upstream response", async () => {
    mockFetchOnce({}, false, 503);
    await expect(searchStickers({ q: "cat", offset: 0 })).rejects.toMatchObject(
      { status: 502 },
    );
  });

  it("throws GiphyError(502) when the response fails validation", async () => {
    mockFetchOnce({ data: "not-an-array", pagination: {} });
    await expect(searchStickers({ q: "cat", offset: 0 })).rejects.toMatchObject(
      { status: 502 },
    );
  });
});
