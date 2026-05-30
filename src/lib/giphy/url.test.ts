import { describe, expect, it } from "vitest";

import { toProxiedUrl } from "./url";

describe("toProxiedUrl", () => {
  it("wraps a raw URL as a same-origin proxy path", () => {
    expect(toProxiedUrl("https://media.giphy.com/media/abc/giphy.gif")).toBe(
      "/api/giphy/image?u=https%3A%2F%2Fmedia.giphy.com%2Fmedia%2Fabc%2Fgiphy.gif",
    );
  });

  it("encodes query characters so they survive the round trip", () => {
    const proxied = toProxiedUrl("https://media.giphy.com/x?a=1&b=2");
    expect(proxied).toContain("%3Fa%3D1%26b%3D2");
    const decoded = decodeURIComponent(proxied.split("u=")[1] ?? "");
    expect(decoded).toBe("https://media.giphy.com/x?a=1&b=2");
  });
});
