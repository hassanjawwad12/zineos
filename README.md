# ZINEOS

> A maximalist Y2K collage studio that boots like a haunted operating system.

ZINEOS is a single, deep frontend showcase: a retro-OS shell (Win98-style chrome
windows, menu bar, taskbar, boot sequence) wrapping a chaotic holographic canvas
you build from transparent GIPHY stickers — then **export as a flattened PNG** or
**share the whole scene as a compressed URL**, with no backend database.

**Stack:** Next.js 16 (App Router) · TypeScript (strict) · React 19 · CSS Modules +
design tokens · Zustand (+ zundo + persist) · TanStack Query · zod · lz-string.

---

## The three things this repo demonstrates

1. **A 2D transform engine built from raw pointer math — no editor library.**
   Drag, 8-handle resize, rotate, and the hard one — *resize-while-rotated* — are
   implemented from `pointerdown`/`move`/`up` with `setPointerCapture`. The math
   lives in pure, unit-tested functions ([`src/lib/transform/`](src/lib/transform/)):
   the resize keeps the opposite handle pinned in world space by transforming the
   pointer into the node's un-rotated local frame. **No `react-rnd` / `interact.js`
   / `moveable`.**

2. **Live GIPHY sticker search through a secret-safe, SSRF-guarded proxy.**
   The API key is server-only and never ships to the client. An image proxy
   ([`/api/giphy/image`](src/app/api/giphy/image/route.ts)) re-streams sticker
   media from our own origin, so the export canvas is **never CORS-tainted** and
   the CSP can stay `img-src 'self'`.

3. **Flattened PNG export via manual canvas compositing, and share-by-URL.**
   Export ([`src/lib/export/`](src/lib/export/compose-canvas.ts)) sets a per-node
   `ctx.setTransform` and `drawImage`s in z-order — no `html2canvas`. The full
   scene is serialized, `lz-string`-compressed, and carried in a `?z=` param.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # add your server-side GIPHY key
npm run dev                  # http://localhost:3000
```

Get a free key at the [GIPHY developer dashboard](https://developers.giphy.com/dashboard/)
and set `GIPHY_API_KEY` (never prefix it with `NEXT_PUBLIC_`).

> No key handy? The **+ Demo** button and the paste-a-GIPHY-URL box work without
> one — they exercise the image proxy + export directly.

---

## Features

- **Direct-manipulation canvas** — drag, resize (8 handles, `Shift` = aspect-lock),
  rotate (`Shift` = 15° snap), and resize-while-rotated with a pinned anchor.
- **Perf-first gestures** — during a drag/resize/rotate the transform is written
  straight to the DOM node in `requestAnimationFrame`, bypassing React; the store
  commits once on release (so one gesture = one undo step).
- **Layers panel** — the keyboard-accessible equal of the canvas: select, reorder,
  bring-forward/send-back, delete.
- **GIPHY drawer** — debounced search, keyword presets, infinite scroll, and full
  loading / empty / error / retry states.
- **Undo/redo, autosave, share** — zundo history, localStorage persistence, and
  `?z=` share links that rebuild the exact collage.
- **The aesthetic** — boot sequence, CRT scanlines + grain + vignette, holographic
  hue-drift, synthesized 8-bit Web Audio UI sounds. All gated by
  `prefers-reduced-motion`; sound is toggleable.

---

## Keyboard

| Action | Keys |
|---|---|
| Nudge selection | Arrows (`Shift` = 10px) |
| Z-order | `]` / `[` (forward/back), `⌘]` / `⌘[` (front/back) |
| Duplicate / Delete | `⌘D` / `Delete` |
| Undo / Redo | `⌘Z` / `⇧⌘Z` |
| Deselect | `Esc` |

The Layers panel is fully tab-navigable, and meaningful actions are announced via
an `aria-live` region.

---

## Architecture

```
src/
  app/            route handlers (GIPHY search + image proxy), layout, providers
  components/
    boot/         BootScreen, CRTOverlay
    canvas/       Canvas, StickerNodeView, SelectionOverlay (handles)
    chrome/       MenuBar, Toolbar, StatusBar, Taskbar, AboutDialog
    drawer/       StickerDrawer, SearchBar, StickerGrid, StickerResult
    layers/       LayersPanel, LayerRow
  hooks/          usePointerDrag, useTransformHandles, useKeyboardShortcuts,
                  useGiphySearch, useAutosave, useFocusTrap, useReducedMotion …
  lib/
    transform/    geometry, resize, rotate   ← pure, heavily unit-tested
    scene/        types, serialize, share-url
    giphy/        client (server-only), schema, ssrf, search-client
    audio/        engine (raw Web Audio), sounds, play (lazy)
    export/       compose-canvas
  store/          useSceneStore (zustand+zundo+persist), useUiStore, useAnnouncer
  styles/         tokens.css, atmosphere.css
```

- **State model** — scene graph in `useSceneStore` (immutable updates, per-node
  selector subscriptions so moving one sticker re-renders no siblings); transient
  UI in `useUiStore`; server state (GIPHY) only in TanStack Query, never duplicated.
- **The look lives in `src/styles/tokens.css`** — one oklch palette, type scale,
  bevels, durations. Two-layer rule: chrome is strictly mono-gray + OS blue; all
  color lives on the canvas.

---

## Performance

- **No editor / UI / animation libraries** — the transform engine, OS chrome, and
  motion are hand-built, so they cost only what they use.
- **Dynamic imports** — the PNG export module and the Web Audio engine load on
  first use only (never in the initial bundle).
- **Gesture path** — direct DOM writes in `rAF`, transform/opacity only (compositor
  friendly), `will-change` added on gesture start and removed on end.
- **No CLS** — every sticker/result has explicit dimensions; drawer images are lazy.

CWV targets: LCP < 2.5s, INP < 200ms, CLS < 0.1. Verify with Lighthouse against a
production build (`npm run build && npm start`).

---

## Security

- `GIPHY_API_KEY` is server-only; failures return a generic message (no key leak).
- The image proxy allowlists only `*.giphy.com` https media hosts (SSRF guard).
- All route input is zod-validated and clamped.
- Share links are a trust boundary: every node is validated, and a node's image
  `src` **must** be our proxy path — a malicious `?z=` can't make a visitor's
  browser fetch an arbitrary URL. Titles are sanitized before render/export.
- Tight CSP (`img-src 'self'`, `frame-ancestors 'none'`, …) + HSTS / nosniff /
  Referrer-Policy / Permissions-Policy — see [`next.config.ts`](next.config.ts).

---

## Testing

```bash
npm test          # Vitest (happy-dom)
npm run test:cov  # with coverage
```

122 tests cover the transform math (incl. the rotated-resize anchor invariant
across rotations × handles), scene serialization round-trips and the share-link
trust boundary, store reducers (immutability, z-order, undo/redo), and the hooks
(drag, keyboard, search, focus trap, feedback). Coverage gate: 80% on the logic
layer.

```bash
npm run lint        # ESLint
npm run stylelint   # Stylelint
npm run typecheck   # tsc --noEmit
```

---

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Set the `GIPHY_API_KEY` environment variable.
3. Deploy — App Router route handlers run as edge/serverless functions; each PR
   gets a preview URL. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
   runs lint → stylelint → typecheck → test → build.

---

## Optional: authentic fonts

The chrome uses a Win98-faithful system fallback (`Tahoma`) and a monospace pixel
fallback out of the box. To self-host the locked display faces, drop
`W95FA.woff2` and `DepartureMono-Regular.woff2` into `public/fonts/` and add an
`@font-face` block in `src/styles/tokens.css` (the family names are already first
in the stacks). `font-display: swap` keeps the fallback rendering until they load.
