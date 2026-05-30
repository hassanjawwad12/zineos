import { NextResponse } from "next/server";

import { GiphyError, searchStickers } from "@/lib/giphy/client";
import { SearchParamsSchema } from "@/lib/giphy/schema";

/**
 * GET /api/giphy/search?q=&offset=
 * Validates params with zod, calls GIPHY server-side (key stays on the server),
 * and returns a trimmed, same-origin-proxied payload.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = SearchParamsSchema.safeParse({
    q: searchParams.get("q") ?? "",
    offset: searchParams.get("offset") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters" },
      { status: 400 },
    );
  }

  try {
    const payload = await searchStickers(parsed.data);
    return NextResponse.json(payload, {
      headers: {
        // Cache identical queries; allow brief stale-while-revalidate.
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    if (error instanceof GiphyError) {
      // Map upstream/server errors to a generic client message (no key leak).
      const status = error.status >= 500 ? 502 : error.status;
      return NextResponse.json(
        { error: "Sticker search is unavailable right now" },
        { status },
      );
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
