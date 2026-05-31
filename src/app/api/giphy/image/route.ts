import { parseAllowedGiphyUrl } from "@/lib/giphy/ssrf";

/**
 * GET /api/giphy/image?u=<giphy-media-url>
 *
 * Refetches a GIPHY sticker and streams it back from OUR origin. This is the
 * load-bearing trick: because the canvas then draws a same-origin image, the
 * export canvas is never tainted (kills the #1 export landmine) and our CSP can
 * stay `img-src 'self'`.
 *
 * SSRF-guarded: only https GIPHY media hosts are allowed (see ssrf.ts).
 */

const ONE_YEAR = 60 * 60 * 24 * 365;
const ALLOWED_CONTENT_TYPES = ["image/gif", "image/webp", "image/png"];

// This route streams per-sticker binary media; it must never be statically
// cached or share a body across distinct `?u=` values. Edge/browser caching is
// handled by the Cache-Control response header below (keyed per full URL).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("u");

  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  const allowed = parseAllowedGiphyUrl(raw);
  if (!allowed) {
    return new Response("Forbidden host", { status: 403 });
  }

  let upstream: Response;
  try {
    // `no-store` keeps this binary OUT of Next's Data Cache (which is for
    // text/JSON, caps entries at 2MB, and mishandles a streamed body shared
    // across requests — the bug behind every sticker showing the same GIF on
    // Vercel). Edge + browser caching is done via Cache-Control instead, keyed
    // per full URL so each `?u=` sticker caches independently.
    upstream = await fetch(allowed, {
      headers: { Accept: "image/*" },
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const baseType = contentType.split(";")[0]?.trim() ?? "";
  if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
    // Defense in depth: don't relay arbitrary content types through the proxy.
    return new Response("Unsupported media type", { status: 415 });
  }

  // Buffer the bytes before responding: returning a raw upstream stream can be
  // reused/locked across requests on the serverless runtime. These are small
  // (200w) renditions, so a full read is cheap and safe.
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": baseType,
      "Cache-Control": `public, max-age=${ONE_YEAR}, immutable`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
