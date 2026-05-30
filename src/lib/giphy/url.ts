/**
 * Client-safe URL helpers (no server-only deps). Both the server GIPHY client
 * and client components import from here.
 */

/** Build the same-origin proxied URL for a raw GIPHY media URL. */
export function toProxiedUrl(rawUrl: string): string {
  return `/api/giphy/image?u=${encodeURIComponent(rawUrl)}`;
}
