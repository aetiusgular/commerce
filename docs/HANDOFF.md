# Handoff — `feat/storefront-overhaul`

All changes are written and **uncommitted** on the branch `feat/storefront-overhaul`.
They're uncommitted deliberately: git identity isn't configured in the analysis
environment, and commits should carry your name, not a placeholder.

App code **typechecks clean**. Everything touched is **Prettier-clean**.

---

## 1. Install, verify, run

This repo uses **bun** (`bun.lock`). Commands below use it.

```bash
cd ~/Desktop/projects2026/commerce

bun install                       # picks up the new @playwright/test dev dependency
bunx playwright install chromium  # one-time browser download

bun run typecheck   # should be clean
bun run build       # first real build check — could not run in the sandbox
bun run dev:3001    # dev server on :3001 (3000 is your other project)
                    # then, in another terminal:
bun run test:e2e        # runs the suite (defaults to :3001) mobile + desktop
bun run test:e2e:headed # same, but watch it drive the browser
```

Port note: the storefront runs on **:3001** so it doesn't clash with the
project you're running on :3000. `bun run dev:3001` and the Playwright config
both default to 3001; override with `PORT=4000 …` on either if needed.

`bunx playwright show-report` opens the HTML report with screenshots.

> **Why the tests "skip" rather than fail:** anything that depends on
> merchandising you haven't set up yet (a product with a Compare-at price, the
> sale banner metafield, a measurements metafield, the pixel ID) reports SKIP
> with the reason. Green means genuinely verified — not silently assumed.

---

## 2. Commit plan

The work groups cleanly. Suggested sequence:

```bash
git add components/home/video-background.tsx components/layout/persistent-hero.tsx
git commit -m "chore: pre-existing local WIP (video/hero load tweaks)"

git add lib/shopify/fragments/product.ts lib/shopify/types.ts lib/utils.ts \
        components/grid/tile.tsx components/layout/product-grid-items.tsx \
        components/product/product-description.tsx
git commit -m "feat: compare-at sale pricing on cards and PDP"

git add components/product/gallery.tsx "app/product/[handle]/page.tsx"
git commit -m "fix: mobile product gallery no longer traps page scroll"

git add components/product/measurements.tsx components/product/division.tsx
git commit -m "feat: product measurements section from custom.measurements metafield"

git add components/layout/sale-banner.tsx lib/shopify/index.ts app/layout.tsx
git commit -m "feat: metafield-controlled site-wide sale banner"

git add components/layout/search/filter/filter-bar.tsx \
        components/layout/search/collections.tsx app/shop/layout.tsx
git commit -m "refactor: compact desktop filter bar, full-width product grid"

git add lib/analytics.ts components/analytics .env.example \
        components/cart/add-to-cart.tsx
git commit -m "feat: meta/instagram pixel with SPA pageview, ViewContent, AddToCart"

git add components/layout/navbar/navbar-content.tsx
git commit -m "fix: remove account section"

git add "app/installations/[handle]/page.tsx" app/globals.css
git commit -m "feat: wider article image placement + By {author} line"

git add package.json playwright.config.ts tests docs \
        AGMNT_FIX_PROMPTS.md AGMNT_DESIGN_PROMPT.md
git commit -m "chore: playwright e2e suite, knowledge graph, docs"
```

---

## 3. Configuration you still need to do

Nothing below is code — it's all data. Until you set it, the corresponding
feature renders nothing (by design, so the site never shows an empty header
or a broken banner).

### Meta / Instagram Pixel
1. Meta Events Manager → Data Sources → your pixel → copy the ID.
2. Local: `.env.local` already has the key — fill it in:
   `NEXT_PUBLIC_META_PIXEL_ID="1234567890"`
3. Production: **Vercel → Project → Settings → Environment Variables** → add
   `NEXT_PUBLIC_META_PIXEL_ID` for Production (and Preview if you want).
   It must be `NEXT_PUBLIC_`-prefixed to reach the browser.
4. Redeploy, then verify in Meta's Events Manager "Test events" tab, or run
   `bun run test:e2e` — the pixel test un-skips once the ID is set.

Events wired: `PageView` (incl. client-side route changes), `ViewContent`
(product page), `AddToCart`. All are no-ops when the ID is absent.

### Sale prices
Shopify admin → product → variant → **Compare-at price**, set *higher* than
Price. That is what drives the strike-through, the red sale price, the `−XX%`,
and the SALE tag. Products without it render exactly as before.

### Sale banner
Shopify admin → Settings → Custom data → **Shop** → add metafields:

| Namespace + key | Type | Notes |
|---|---|---|
| `custom.sale_banner_text` | Single line text | The copy. Required. |
| `custom.sale_banner_active` | Boolean | Optional. Only an explicit `false` hides it. |
| `custom.sale_banner_link` | URL | Optional. Makes the banner clickable. |

Then fill in the Shop metafield values. No redeploy needed.

### Measurements
Shopify admin → Settings → Custom data → **Product** → add `custom.measurements`
(JSON, or multi-line text). Then set it per product:

- JSON: `{"Chest":"56 cm","Shoulder":"46 cm","Length":"68 cm"}`
- Text: one `Label: value` per line

### Article author
Set the author on each blog post in Shopify (the post's Author field / authorV2).
The article renders `By {name}` and hides the line entirely when empty.

### Editorial article — author, credits, and extra images
The installations article page matches the SS26 reference. It reads these
**Article** metafields (Shopify admin → Settings → Custom data → **Article**);
every one is optional and the layout degrades gracefully when unset:

| Namespace + key | Type | Purpose |
|---|---|---|
| `custom.category` | Single line text | Kicker label, e.g. "Interview" (falls back to the first tag) |
| `custom.author_role` | Single line text | Shown under the end byline, e.g. "Contributing Editor, AGMNT" |
| `custom.photography` | Single line text | Credit in the header meta, e.g. "Studio AGMNT" |
| `custom.read_time` | Single line text | e.g. "12 min read" (auto-estimated from the body when unset) |
| `custom.gallery` | **File reference (list)** | Extra images beyond the hero. Rendered two-up on desktop / stacked on mobile, exactly like the reference. Add as many as you want. |

Images in the article body itself (the Shopify rich-text editor) also break out
wider than the text column automatically. So there are three ways to place
multiple images: the hero (featured image), inline body images, and the
`custom.gallery` list.

---

## 4. Known leftovers

- `components/layout/search/filter/index.tsx` and `filter/item.tsx` are now
  **dead code** — the desktop sidebar they powered was replaced by
  `filter/filter-bar.tsx`. I left them in place rather than delete them; remove
  them when you're happy with the new bar.
- 48 files fail `prettier --check` from *before* this work. Everything I touched
  is formatted. Run `bun run prettier` if you want the whole repo clean — do it as
  its own commit so it doesn't bury the feature diffs.
- `bun run build` was never executed (the sandbox can't reach Shopify). Run it
  before deploying.
