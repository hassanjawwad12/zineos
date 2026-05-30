import { describe, expect, it } from "vitest";

import { parseAllowedGiphyUrl } from "./ssrf";

describe("parseAllowedGiphyUrl", () => {
  it("accepts https media.giphy.com URLs", () => {
    const url = parseAllowedGiphyUrl(
      "https://media.giphy.com/media/abc/giphy.gif",
    );
    expect(url?.hostname).toBe("media.giphy.com");
  });

  it("accepts the bare giphy.com host", () => {
    expect(parseAllowedGiphyUrl("https://giphy.com/x.gif")).not.toBeNull();
  });

  it("accepts numbered media subdomains", () => {
    expect(
      parseAllowedGiphyUrl("https://media0.giphy.com/media/x/giphy.gif"),
    ).not.toBeNull();
  });

  it("rejects non-https schemes", () => {
    expect(parseAllowedGiphyUrl("http://media.giphy.com/x.gif")).toBeNull();
  });

  it("rejects arbitrary hosts (SSRF)", () => {
    expect(parseAllowedGiphyUrl("https://evil.com/x.gif")).toBeNull();
    expect(parseAllowedGiphyUrl("https://169.254.169.254/")).toBeNull();
  });

  it("rejects look-alike hosts that merely contain giphy.com", () => {
    expect(parseAllowedGiphyUrl("https://giphy.com.evil.net/x")).toBeNull();
    expect(parseAllowedGiphyUrl("https://notgiphy.com/x")).toBeNull();
  });

  it("rejects URLs carrying embedded credentials", () => {
    expect(
      parseAllowedGiphyUrl("https://user:pass@media.giphy.com/x.gif"),
    ).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(parseAllowedGiphyUrl("not a url")).toBeNull();
    expect(parseAllowedGiphyUrl("")).toBeNull();
  });
});
