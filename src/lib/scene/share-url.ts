import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import { deserializeScene, serializeScene } from "./serialize";
import type { Scene } from "./types";

/**
 * Share links with no backend: the whole scene is serialized, lz-string
 * compressed, and carried in a `?z=` query param. Opening such a link rebuilds
 * the exact collage.
 */

export const SHARE_PARAM = "z";

/** Compress a scene into a URL-safe `?z=` value. */
export function encodeSceneToParam(scene: Scene): string {
  return compressToEncodedURIComponent(serializeScene(scene));
}

/** Decompress + validate a `?z=` value back into a scene (null if invalid). */
export function decodeSceneFromParam(param: string): Scene | null {
  const json = decompressFromEncodedURIComponent(param);
  if (!json) return null;
  return deserializeScene(json);
}

/** Build a full shareable URL for `scene` against a base origin+path. */
export function buildShareUrl(scene: Scene, baseUrl: string): string {
  const param = encodeSceneToParam(scene);
  return `${baseUrl}?${SHARE_PARAM}=${param}`;
}
