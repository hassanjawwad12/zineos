/**
 * SSRF guard for the image proxy. The proxy refetches a sticker URL and streams
 * it from our origin (so the export canvas stays untainted). Without an
 * allowlist, `?u=` would be an open proxy / SSRF primitive — so we accept ONLY
 * GIPHY media hosts over https.
 */

const ALLOWED_HOST_SUFFIXES = [
  ".giphy.com",
  ".giphy.media", // some renditions are served from media subdomains
] as const;

const ALLOWED_EXACT_HOSTS = ["giphy.com"] as const;

/**
 * Returns a validated URL object iff `raw` is an https GIPHY media URL.
 * Returns null for anything else (other hosts, non-https, malformed input,
 * embedded credentials, etc.).
 */
export function parseAllowedGiphyUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null; // reject creds in URL

  const host = url.hostname.toLowerCase();

  const exactOk = ALLOWED_EXACT_HOSTS.includes(
    host as (typeof ALLOWED_EXACT_HOSTS)[number],
  );
  const suffixOk = ALLOWED_HOST_SUFFIXES.some((suffix) =>
    host.endsWith(suffix),
  );

  return exactOk || suffixOk ? url : null;
}
