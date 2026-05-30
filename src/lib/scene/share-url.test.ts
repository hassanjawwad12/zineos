import { describe, expect, it } from "vitest";

import {
  buildShareUrl,
  decodeSceneFromParam,
  encodeSceneToParam,
  SHARE_PARAM,
} from "./share-url";
import type { Scene, StickerNode } from "./types";

const PROXY = "/api/giphy/image?u=https%3A%2F%2Fmedia.giphy.com%2Fx.gif";

function scene(): Scene {
  const a: StickerNode = {
    id: "a",
    giphyId: "g",
    src: PROXY,
    baseWidth: 200,
    baseHeight: 100,
    x: 12,
    y: -34,
    scaleX: 1.1,
    scaleY: 0.7,
    rotation: 0.42,
    z: 0,
    title: "y2k",
  };
  return { nodes: { a }, order: ["a"] };
}

describe("share-url", () => {
  it("encodes then decodes back to the same scene", () => {
    const s = scene();
    const restored = decodeSceneFromParam(encodeSceneToParam(s));
    expect(restored).toEqual(s);
  });

  it("produces a URL-safe param (no characters needing escaping)", () => {
    const param = encodeSceneToParam(scene());
    expect(param).toBe(encodeURIComponent(param));
  });

  it("builds a full share URL with the z param", () => {
    const url = buildShareUrl(scene(), "https://zineos.app/");
    expect(url.startsWith(`https://zineos.app/?${SHARE_PARAM}=`)).toBe(true);
  });

  it("returns null for an undecompressable param", () => {
    expect(decodeSceneFromParam("####not-valid####")).toBeNull();
  });

  it("round-trips an empty scene", () => {
    const empty: Scene = { nodes: {}, order: [] };
    expect(decodeSceneFromParam(encodeSceneToParam(empty))).toEqual(empty);
  });
});
