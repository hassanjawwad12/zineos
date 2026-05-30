# ZINEOS — Build Plan

> A maximalist Y2K collage studio that boots like a haunted operating system.
> Frontend showcase product. Next.js 15 (App Router) + TypeScript. Hand-built
> transform engine, GIPHY sticker pipeline, exportable + shareable creations.

**Working title:** `ZINEOS` (placeholder — rename freely). The product *looks*
like a retro OS (Win98-style chrome windows, menu bar, taskbar, boot screen),
but the canvas inside it is a chaotic holographic Y2K zine you build from
transparent GIPHY stickers.

---

## 1. The point of this project

This is **not** a biography portfolio site. It is a single, deep, polished
*tool* that survives two very different reviewers:

- **The 8-second recruiter screen** — open link → drag a glittering sticker →
  it feels alive. There is a money-shot interaction in the first 5 seconds.
- **The senior engineer who opens the repo** — finds a from-scratch
  direct-manipulation canvas (drag / resize / rotate / layer) with **raw
  pointer math and zero `react-rnd`/`interact.js`/`moveable`**, clean state,
  real a11y, and a secret-safe API proxy.

The aesthetic is the **differentiation** (memorable, not another sterile
whiteboard clone). The from-scratch transform engine is the **substance**.

### Repo narrative (what the README must say in 3 bullets)
- Built a 2D transform engine (translate / scale / rotate-about-center /
  resize-while-rotated) from raw pointer events — no editor library.
- Live GIPHY sticker search through a **server-side proxy** (API key never
  ships to the client; image proxy makes canvas export CORS-safe).
- Exports a flattened PNG via manual canvas compositing, and shares the full
  scene as a compressed URL — no backend database.

---

## 2. Aesthetic direction — 🔒 LOCKED: "HAUNTED OS / CHROME DREAM"

**Locked: Y2K / Frutiger-Aero holographic maximalism, wrapped in Win98/2000
system chrome.** This is final. The alternatives (90s grunge zine, Win95
monochrome) were evaluated and rejected for the reasons below.

**Why this won (not inertia — evidence):**
- **Best thumbnail punch (the 8-second test):** iridescent/chrome/neon reads
  instantly even at portfolio-thumbnail size. Grunge reads as muddy noise when
  small; pure Win95 reads as a gray box.
- **Harmonizes with the actual content:** the canvas fills with GIPHY stickers,
  and the richest, most *abundant* sticker categories (pixel art, vaporwave,
  y2k, holographic, win95) are *born* in this palette. Grunge would force us to
  hunt rare halftone/photocopy stickers and fight our own content.
- **Most distinctive combination:** "I rebuilt Windows 98" clones are common
  now; pure grunge is hard to pull off without looking like a cheap filter. The
  *tension* — disciplined OS chrome vs. chaotic holographic canvas — is a point
  of view, not a costume.
- **Highest build confidence:** every effect is **pure CSS** (gradients,
  `background-clip: text`, blend modes, SVG-noise grain, scanline overlay) — no
  heavy texture image assets, so it stays inside the perf budget. Grunge needs
  real texture assets (bundle weight + amateur-filter risk).

The deliberate point of view: **disciplined chrome, chaotic canvas.** The
*tool UI* (toolbars, panels, drawers, dialogs) is rendered as chunky beveled
OS windows with draggable title bars. The *creative canvas* is loud —
holographic gradients, chrome text, CRT scanlines, grain, cursor trail.

This satisfies the anti-template policy by demonstrating well over four
required qualities: scale-contrast hierarchy, intentional rhythm, real depth
(beveled surfaces + overlap + scanline atmosphere), typography with character
(pixel display + system grotesque), semantic color, designed hover/focus/active
states, grid-breaking editorial composition, texture/grain, and motion that
clarifies (snap, settle, layer changes).

**Discipline guardrails (what keeps it "designed," not "noisy") — LOCKED:**
- **Two-layer rule:** the **chrome layer** (toolbars, panels, dialogs, taskbar)
  stays strictly monochrome-gray + the iconic OS blue. ALL color and chaos lives
  ONLY on the **canvas content layer**. This contrast *is* the concept.
- **One hero holographic gradient**, used intentionally (title text, primary
  CTA, boot logo) — never smeared across every surface.
- Scanline + grain capped at ≤ 4% opacity: atmosphere, not interference.
- Everything still passes WCAG contrast + fully honors `prefers-reduced-motion`.

> The look lives entirely in `styles/tokens.css`. It is locked, but token-driven,
> so future tuning is a value change, not a rewrite.

---

## 3. Tech stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15, App Router** | Required. Route Handlers give us a secret-safe GIPHY proxy without a separate backend. |
| Language | **TypeScript (strict)** | Required. `strict`, `noUncheckedIndexedAccess`. |
| UI runtime | **React 19** | Ships with Next 15. |
| Styling | **CSS Modules + global `tokens.css`** | No UI library default-look. Raw CSS demonstrates mastery (CRT flicker, holographic gradients, bevels). Zero style runtime → tiny bundle. |
| Canvas/client state | **Zustand** + `persist` middleware | Selector subscriptions let one moving sticker re-render alone. `persist` = localStorage autosave. |
| Undo/redo | **zundo** (Zustand temporal middleware) | Recruiter-expected feature, integrates cleanly. |
| Server state | **TanStack Query** | GIPHY search: caching identical queries, infinite-scroll pagination, loading/empty/error states. |
| URL state | **lz-string** | Compress scene → base64 → `?z=` param. Shareable creations, no DB. |
| Validation | **zod** | Validate route-handler query params + GIPHY response at the boundary. |
| Transform/drag | **Raw Pointer Events** (no lib) | The core flex. Hand-built matrix math. |
| Export | **Manual Canvas compositing** | `ctx.setTransform` per node. Full control, no `html2canvas` bloat/taint. |
| Audio | **Raw Web Audio API** (no Tone.js) | Synthesized 8-bit click/stamp/drag from oscillators + envelopes. Standalone flex, ~0 bundle. |
| Motion | **CSS transitions + `requestAnimationFrame`** | Compositor-friendly only. No Framer Motion (keeps the "raw" story + tiny bundle). |
| Test (unit) | **Vitest + React Testing Library** | Pure transform math, serialization, store reducers. |
| Test (E2E + visual) | **Playwright** | Visual regression at required breakpoints + critical flows. |
| Test (a11y) | **@axe-core/playwright** | Automated accessibility checks in CI. |
| Test (perf) | **Lighthouse CI** | Enforce CWV + bundle budgets. |
| Lint/format | **ESLint + Prettier + Stylelint** | Wired to PostToolUse hooks. |
| Deploy | **Vercel** | Edge route handlers, preview URLs per PR. |

**Explicitly rejected:** `react-rnd`, `interact.js`, `moveable`, `html2canvas`,
Tailwind (default-look risk), any drag/resize/rotate library, any UI component
library, Framer Motion. Building these by hand *is the portfolio*.

---

## 4. Architecture

### 4.1 The transform engine (the heart — get this right)

Each sticker is an immutable node. Transform is stored as **center position +
scale + rotation** (not top/left + width), because rotation and scale are
intuitive about a center.

```ts
// lib/scene/types.ts
export interface StickerNode {
  readonly id: string;
  readonly giphyId: string;
  readonly src: string;          // proxied URL (same-origin)
  readonly baseWidth: number;    // natural px
  readonly baseHeight: number;
  readonly x: number;            // center, canvas coords
  readonly y: number;            // center, canvas coords
  readonly scale: number;
  readonly rotation: number;     // radians
  readonly z: number;            // stacking order
  readonly title: string;        // sanitized, for a11y/export alt
}
```

Render via a single composed transform with center origin:

```
transform: translate(-50%, -50%)
           translate(var(--x), var(--y))
           rotate(var(--rot))
           scale(var(--scale));
transform-origin: center;
```

Three interactions, all from `pointerdown`/`pointermove`/`pointerup` with
`setPointerCapture`:

1. **Drag** — add screen-space pointer delta to `x, y` (divided by viewport
   zoom if pan/zoom enabled).
2. **Rotate** — handle above the node; `rotation = atan2(pointer − center) −
   grabAngle`. Hold a modifier → snap to 15° increments.
3. **Resize-while-rotated (the hard part — this is where credibility lives).**
   Most portfolio editors cheat here with a library. We do it by hand:
   - Keep the **opposite handle** fixed in world space as the anchor.
   - Transform the live pointer into the node's **local (un-rotated) frame** by
     rotating `(pointer − anchor)` by `−rotation`.
   - Derive new size from that local vector; recompute the new center as
     `anchor + rotate(localHalfVector, rotation)` so the anchor stays pinned.
   - Hold a modifier → lock aspect ratio.

   All of this lives in **pure, unit-tested** functions in
   `lib/transform/matrix.ts` and `lib/transform/geometry.ts` (vector rotate,
   AABB of a rotated rect, point-in-rotated-rect for hit-testing).

**Perf rule for drag:** during an active gesture, write the transform
**directly to the DOM node via a ref** (bypass React entirely), batched in
`requestAnimationFrame`. Commit the final transform to the Zustand store only
on `pointerup`. This is the canonical canvas-editor perf pattern — no per-frame
React renders, no re-rendering sibling stickers.

### 4.2 State model

- **`useSceneStore` (Zustand + zundo + persist)** — the scene graph:
  `nodes: Record<id, StickerNode>`, `order: id[]` (z-order), plus actions
  (`add`, `remove`, `updateTransform`, `bringToFront`, `sendToBack`,
  `duplicate`). Immutable updates only. `zundo` wraps it for undo/redo.
  `persist` autosaves to localStorage.
- **`useUiStore` (Zustand)** — transient UI: selection set, active tool,
  drawer open, viewport pan/zoom. Not persisted, not in history.
- **URL state** — on "Share", serialize scene (strip transient) → `lz-string`
  → `?z=`. On load: hydrate from `?z=` if present, else localStorage, else
  empty canvas. (Server state = GIPHY only; never duplicated into the store.)

### 4.3 GIPHY pipeline (secret-safe + export-safe)

Two Route Handlers. The API key is **server-only** (`GIPHY_API_KEY`, never
`NEXT_PUBLIC_`).

- `app/api/giphy/search/route.ts` — GET `?q=&offset=`. zod-validates params,
  calls GIPHY **stickers** search server-side, returns a trimmed payload
  (`id, src, width, height, title`), sets `Cache-Control`.
- `app/api/giphy/image/route.ts` — GET `?u=`. **SSRF guard: allowlist only
  `*.giphy.com` media hosts.** Refetches the sticker and streams it back from
  our origin with cache headers. Because images are now same-origin, the export
  canvas is **never tainted** (this kills the #1 landmine) *and* our CSP can
  tighten to `img-src 'self'`.

Client uses TanStack Query against `/api/giphy/search` (debounced input,
infinite scroll). GIPHY attribution ("Powered By GIPHY" mark) is rendered in
the drawer footer per their API terms.

### 4.4 Export & share

- **PNG export** — `lib/export/compose-canvas.ts`: create an offscreen canvas at
  the zine's bounds, for each node in z-order `ctx.setTransform(...)` to match
  its translate/rotate/scale, `drawImage` the proxied sticker, reset. Download
  via `toBlob`. Dynamically imported (only loaded when the user clicks Export).
  > Animated GIFs composite as a **single frame** — exporting a *static* PNG
  > snapshot is in scope and expected. Animated GIF/WebM export is a **stretch
  > goal** (frame loop + `gif.js`/WebCodecs), not a promise.
- **Share URL** — compressed scene in the query string; opening it rebuilds the
  exact collage. Demonstrates serialization + compression with no backend.

### 4.5 File organization (feature-based, per global rules)

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    api/giphy/search/route.ts
    api/giphy/image/route.ts
  components/
    boot/        BootScreen.tsx  CRTOverlay.tsx  boot.css
    chrome/      Window.tsx  TitleBar.tsx  MenuBar.tsx  Toolbar.tsx
                 StatusBar.tsx  Taskbar.tsx  chrome.css
    canvas/      Canvas.tsx  StickerNode.tsx  SelectionBox.tsx
                 TransformHandles.tsx  Marquee.tsx  canvas.css
    drawer/      StickerDrawer.tsx  SearchBar.tsx  StickerGrid.tsx
                 StickerResult.tsx  drawer.css
    layers/      LayersPanel.tsx  LayerRow.tsx  layers.css
    ui/          Button.tsx  Slider.tsx  Tooltip.tsx  Dialog.tsx
  hooks/
    usePointerDrag.ts  useTransformHandles.ts  useGiphySearch.ts
    useKeyboardShortcuts.ts  useReducedMotion.ts  useAutosave.ts
  lib/
    transform/   matrix.ts  geometry.ts           # pure, heavily unit-tested
    scene/       types.ts  serialize.ts  share-url.ts
    giphy/       client.ts  schema.ts  ssrf.ts
    audio/       engine.ts  sounds.ts
    export/      compose-canvas.ts
  store/         useSceneStore.ts  useUiStore.ts
  styles/        tokens.css  typography.css  chrome.css  global.css
e2e/             *.spec.ts
test/            setup.ts  fixtures.ts
```

Files stay 200–400 lines (800 hard max). Each `components/<feature>/` owns its
CSS. No file-type folders.

---

## 5. Design system

`styles/tokens.css` is the single source of truth (oklch palette, type scale,
spacing, durations, eases, bevel edges). Two self-hosted, subset web fonts —
**LOCKED:**

- **`W95FA`** (Windows 95 system-font clone) — ALL OS chrome UI: menus, buttons,
  title bars, labels, status bar.
- **`Departure Mono`** (open-source pixel display) — canvas headers, big type,
  the boot screen.
- **`system-ui`** stack — incidental body text (zero bytes).

`font-display: swap`; preload only the critical weight.

**Signature effects — LOCKED (all pure CSS, all reduced-motion-gated):** OS boot
sequence on first load · CRT scanline overlay + faint vignette · SVG-noise grain ·
slow holographic hue-drift on the hero gradient + chrome `background-clip: text` ·
canvas cursor trail · synthesized 8-bit UI sounds.

```css
:root {
  /* === CANVAS LAYER: Y2K holographic accents (the loud layer) === */
  --holo-cyan:     oklch(86% 0.13 200);
  --holo-magenta:  oklch(78% 0.19 350);   /* bubblegum */
  --holo-lavender: oklch(80% 0.12 300);
  --holo-lime:     oklch(90% 0.18 130);   /* acid accent */
  --holo-grad: linear-gradient(135deg,
    var(--holo-cyan), var(--holo-magenta), var(--holo-lavender));
  /* soft Frutiger-Aero canvas wash so transparent stickers pop */
  --canvas-bg: linear-gradient(160deg, oklch(95% 0.03 220), oklch(93% 0.05 320));

  /* === CHROME LAYER: strict Win98 mono + OS blue (the disciplined layer) === */
  --chrome-face:  oklch(82% 0.005 250);
  --chrome-light: oklch(98% 0 0);          /* top/left bevel */
  --chrome-dark:  oklch(52% 0.01 250);     /* bottom/right bevel */
  --chrome-text:  oklch(20% 0 0);
  --title-grad: linear-gradient(90deg,     /* iconic active title bar */
    oklch(45% 0.15 255), oklch(70% 0.13 220));

  --text-ui:   clamp(0.8rem, 0.76rem + 0.2vw, 0.95rem);
  --text-head: clamp(2rem, 1rem + 5vw, 5rem);

  --space-1: 0.25rem; --space-2: 0.5rem; --space-4: 1rem; --space-8: 2rem;

  --dur-fast: 120ms; --dur-norm: 240ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Motion:** only `transform`, `opacity`, `clip-path`, `filter` (sparingly).
`will-change: transform` is added on gesture start and **removed on end**.
CRT flicker / holographic shimmer / cursor trail all disabled under
`prefers-reduced-motion`.

---

## 6. Accessibility (a freeform canvas done right)

Drag is mouse-centric, so the **LayersPanel is the accessible equal**: fully
keyboard-navigable list of every node with reorder, select, nudge, delete.

- Keyboard: arrows nudge selected node, `Shift+arrow` = coarse nudge,
  `[`/`]` = z-order, `Cmd/Ctrl+Z`/`Shift+Cmd+Z` = undo/redo, `Delete`,
  `Cmd/Ctrl+D` duplicate, `Esc` deselect, `Tab` cycles nodes.
- ARIA: `role="toolbar"` menus, `role="dialog"` + focus trap on the sticker
  drawer, labelled buttons, `aria-live="polite"` announcements ("sticker
  added", "moved to front").
- Semantic HTML shell: `<header>` chrome, `<main>` canvas, `<aside>` panels.
- Color contrast verified for all UI text; focus rings always visible.

---

## 7. Performance budget

CWV targets (LCP < 2.5s, INP < 200ms, CLS < 0.1, FCP < 1.5s). App-page JS
budget < 300kb gz — we aim **< 180kb**.

- Dynamic-import the export module and audio engine (load on first use only).
- Lazy-load the sticker drawer; `loading="lazy"` + explicit `width`/`height` on
  every result (no CLS). Virtualize/IntersectionObserver the result grid.
- Drag = direct DOM writes in `rAF`, transform-only, no React churn.
- Per-node Zustand selectors so moving one sticker never re-renders the rest.
- Minimal first paint (boot screen is cheap CSS); fonts subset + preloaded.

---

## 8. Security

- `GIPHY_API_KEY` server-only; never `NEXT_PUBLIC_`. `.env.example` documents it.
- **SSRF allowlist** on the image proxy (`*.giphy.com` media hosts only).
- zod validation on all route-handler input; clamp `limit`/`offset`.
- CSP (extends the headers already added to `next.config.ts`): with image
  proxying, `img-src 'self'`; `connect-src 'self'`; `script-src 'self'` (nonce
  if any inline needed); `object-src 'none'`; `frame-ancestors 'none'`.
- Sticker `title` sanitized before render/export; no `dangerouslySetInnerHTML`.
- Standard headers: HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

---

## 9. Testing strategy (target 80% coverage)

- **Unit (Vitest):** `lib/transform/*` (rotate-resize math, vector rotate,
  rotated-rect hit-test, AABB), `lib/scene/serialize` + `share-url` round-trips,
  store reducers (immutability, z-order, undo/redo). These pure functions are
  where coverage is cheap and high-signal.
- **Component (RTL):** drawer states (loading/empty/error), layers reorder,
  keyboard shortcuts.
- **E2E + visual regression (Playwright):** screenshot the canvas + chrome at
  **320 / 375 / 768 / 1024 / 1440 / 1920**; assert no overflow. Critical flows:
  search → drag onto canvas → rotate → resize → reorder → export → reload-from-
  URL. Deterministic waits, no arbitrary timeouts.
- **A11y (@axe-core/playwright):** zero serious violations; keyboard-only pass;
  reduced-motion pass.
- **Perf (Lighthouse CI):** enforce CWV + bundle budget in CI.

---

## 10. Tooling & hooks

- ESLint + Prettier + Stylelint + `tsc --noEmit` wired to PostToolUse hooks
  (order: format → lint → type-check). Stop hook runs `build`.
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `perf:`...).
- CI: install → lint → typecheck → unit → build → Playwright (incl. visual +
  axe) → Lighthouse CI. Vercel preview per PR.

`.env.example`
```
GIPHY_API_KEY=your_server_side_key_here
```

---

## 11. Phased build plan (each phase is shippable & demo-able)

> Build order front-loads the two biggest risks (CORS, rotate-resize math).

**Phase 0 — Scaffold & de-risk CORS (½ day)**
- `create-next-app` (App Router, TS strict), tokens.css, ESLint/Prettier/
  Stylelint, Vitest + Playwright, CI skeleton.
- Build the **GIPHY search + image proxy first**, drop one sticker on a canvas,
  and **prove an exported PNG is not tainted**. ✅ Gate: export works before
  anything else is built.

**Phase 1 — Place & drag (1 day)**
- `useSceneStore`, `StickerNode`, click-to-add, pointer drag with rAF +
  direct-DOM-write / commit-on-release. Selection + delete + duplicate.

**Phase 2 — Resize (axis-aligned) (1 day)**
- 8 resize handles, aspect-lock modifier. Pure geometry unit-tested.

**Phase 3 — Rotate + resize-while-rotated (1–2 days) ← the hard, signal-rich part**
- Rotation handle with angle snap; local-frame resize with pinned anchor.
- Heavy unit tests on `lib/transform/*`. ✅ Gate: matrix math correct & tested.

**Phase 4 — Layers & z-order (½ day)**
- `LayersPanel` (the a11y equal), bring-to-front/send-to-back, keyboard reorder.

**Phase 5 — GIPHY drawer, full UX (1 day)**
- TanStack Query, debounced search, infinite scroll, loading/empty/error,
  keyword presets from the cheat sheet (win98 / pixel art / blinkies / vaporwave).

**Phase 6 — Persistence + share URL (½ day)**
- localStorage autosave; serialize → lz-string → `?z=`; hydrate on load.

**Phase 7 — Chrome & aesthetic pass (1–2 days)**
- Win98 windows, menu/tool/status bars, taskbar, boot screen, CRT overlay,
  holographic + grain textures, designed hover/focus/active states.

**Phase 8 — Web Audio juice + a11y + reduced-motion (1 day)**
- Synthesized click/stamp/drag/snap sounds; full keyboard map; aria-live;
  focus trap; reduced-motion + contrast pass.

**Phase 9 — Polish, tests to 80%, perf, deploy, README (1–2 days)**
- Visual regression baselines, Lighthouse budgets green, dynamic-import audit,
  deploy to Vercel, write the recruiter-facing README + short demo GIF.

**Stretch (post-MVP):** animated GIF/WebM export, canvas pan/zoom, multi-select
group transform, sticker filters (hue/CRT), guestbook/visitor-counter widgets,
text stickers with the pixel font.

---

## 12. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| CORS-tainted canvas → export silently fails | High | Same-origin image proxy; **proven in Phase 0** before building anything else. |
| Rotate-resize math wrong/janky | High | Pure functions in `lib/transform/*`, unit-tested first; build incrementally (axis-aligned → rotated). |
| Animated GIFs export as one frame | Med | Ship static PNG (expected); animated export is explicit stretch. |
| Drag lag with many stickers | Med | Direct-DOM-write in rAF + commit-on-release; per-node selectors; virtualized drawer. |
| Bundle bloat | Med | No editor/UI/animation libs; dynamic-import export + audio; CSS Modules. |
| GIPHY key leak / SSRF | High | Server-only key; host allowlist on proxy; zod validation; tight CSP. |
| A11y of a freeform canvas | Med | LayersPanel as keyboard-equal surface; aria-live; focus management. |

---

## 13. Definition of done

- [ ] Search → drag → rotate → resize-while-rotated → reorder → export PNG →
      reload-from-share-URL all work end-to-end.
- [ ] Transform engine is hand-built (no drag/resize/rotate library) and
      `lib/transform/*` is unit-tested.
- [ ] GIPHY key is server-only; image proxy SSRF-guarded; export not tainted.
- [ ] 80%+ coverage; visual regression baselines at all 6 breakpoints; axe clean.
- [ ] CWV + bundle budgets green in Lighthouse CI.
- [ ] Full keyboard operation + reduced-motion + contrast pass.
- [ ] Deployed to Vercel; README tells the 3-bullet engineering story with a
      demo GIF.
```
