# AGMNT Storefront — Knowledge Graph

Generated from a full scan of `/Users/tonyg/Desktop/projects2026/commerce` on the `feat/storefront-overhaul` branch.
This is the canonical map of **what exists**, **how it connects**, **what's broken**, and **what changed**.

---

## 1. System overview

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, canary `15.6.0-canary.60`), React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), `@tailwindcss/typography`, container-queries |
| Language | TypeScript 5.8 (strict; baseline typecheck passes clean) |
| Backend | Shopify Storefront API, GraphQL, **API version `2023-01`** |
| Caching | Next `use cache` + `cacheTag` / `cacheLife`, revalidated by Shopify webhooks |
| Fonts | `font-vremena` — local OTF via `next/font/local` |
| Hosting | Vercel |
| Formatting | Prettier (+ `prettier-plugin-tailwindcss`) — **48 files fail at baseline** |

**Aesthetic contract (do not break):** monochrome — white bg / black text; `font-vremena`; tight negative tracking (`tracking-[-0.04em]`); uppercase nav + section labels; hairline borders (`0.25px`–`0.5px`); no shadows, no gradients, no rounded product imagery. Only one new color is permitted site-wide: a single red sale accent.

---

## 2. Entity graph

### Routes (`app/`)

| Route | File | Depends on |
|---|---|---|
| `/` | `app/page.tsx` | home components, `getShopMetafield` |
| `/shop` | `app/shop/page.tsx` + `layout.tsx` | `getProducts`, `Collections`, `ProductGridItems` |
| `/shop/[collection]` | `app/shop/[collection]/page.tsx` | `getCollectionProducts` |
| `/product/[handle]` | `app/product/[handle]/page.tsx` | `getProduct` → `Gallery` + `ProductDescription` |
| `/installations` | `app/installations/page.tsx` + `article-grid.tsx` | `getArticles` |
| `/installations/[handle]` | `app/installations/[handle]/page.tsx` | `getArticle` |
| `/[page]` | `app/[page]/page.tsx` | `getPage` |
| API | `app/api/{products,collections,newsletter,revalidate}` | Shopify |

**Root layout** (`app/layout.tsx`) mounts: `CartProvider` → `Navbar` → `PersistentHero` → `main` → `Toaster`. It fetches the hero video via `getShopMetafield("custom", "homepage_video")` — **this is the reference pattern for content-driven config.**

### Data layer (`lib/shopify/`)

```
index.ts  ──> shopifyFetch()  ──> Shopify Storefront GraphQL
  ├── getProduct / getProducts / getCollectionProducts  ──> queries/product.ts ──> fragments/product.ts
  ├── getCollections / getCollection                    ──> queries/collection.ts
  ├── getArticles / getArticle / getBlogs              ──> queries/blog.ts       ──> reshapeArticle()
  ├── getCart / addToCart / updateCart / removeFromCart ──> queries+mutations/cart.ts
  └── getShopMetafield(namespace, key)                 ──> inline query  [KEY PATTERN]
```

`reshapeProduct()` spreads `...rest`, so **any field added to the GraphQL fragment automatically survives reshaping** — only the fragment + `types.ts` need updating.

### Component graph (relevant subset)

```
app/layout.tsx
  └── Navbar → navbar-content.tsx ──[had]──> ACCOUNT link (mobile UserIcon + desktop text)  [REMOVED]

app/shop/layout.tsx
  └── Collections (collections.tsx)  ← builds Categories / Brands / Colors sections
        ├── FilterList (filter/index.tsx)      ← desktop vertical sidebar   [REPLACED]
        └── FilterItemDropdown (filter/dropdown.tsx) ← mobile dropdown

app/shop/page.tsx
  └── ProductGridItems → GridTileImage (grid/tile.tsx)  ← renders card price  [SALE UI]

app/product/[handle]/page.tsx
  ├── Gallery (product/gallery.tsx)          ← fixed-height inner scroller   [SCROLL BUG]
  └── ProductDescription (product/product-description.tsx)
        ├── Cookie (numbered section label ➀ ➁ ➂)
        ├── Division (spacer)
        ├── VariantSelector
        └── AddToCart → cart/actions.ts
```

---

## 3. Findings — issues found in the scan

| # | Severity | Finding | Location |
|---|---|---|---|
| F1 | **Critical** | **Mobile scroll trap.** Gallery wrapper is `h-[97.5vh]` and `Gallery` is `h-[95%] overflow-y-auto`. On mobile this nested scroller captures the touch gesture, so description + Add to Cart are effectively unreachable. Direct conversion blocker. | `app/product/[handle]/page.tsx`, `components/product/gallery.tsx` |
| F2 | **Critical** | **No sale data at all.** The product GraphQL fragment never requests `compareAtPriceRange` or variant `compareAtPrice`. Showing an original→sale price is impossible without a data-layer change first. | `lib/shopify/fragments/product.ts`, `lib/shopify/types.ts` |
| F3 | High | No sale banner exists anywhere in the app. | — |
| F4 | High | No Meta/Instagram Pixel. No analytics or conversion tracking of any kind. | `app/layout.tsx` |
| F5 | High | Desktop filter reserves a `md:max-w-[200px]` sidebar column and renders a tall vertical list, squeezing the product grid. | `app/shop/layout.tsx`, `components/layout/search/filter/index.tsx` |
| F6 | Medium | No measurements anywhere on the PDP — a known conversion blocker for archive/avant-garde sizing. | `components/product/product-description.tsx` |
| F7 | Medium | Article body is locked to a single `max-w-3xl` prose column; images cannot break out wider. | `app/installations/[handle]/page.tsx` |
| F8 | Medium | Account section links out to `shop.agmnt.space/account` (Shopify-hosted) — unwanted. | `components/layout/navbar/navbar-content.tsx` |
| F9 | Low | **Debug `console.log('Product data', ...)` shipping to production** on every product render. | `components/product/product-description.tsx` |
| F10 | Low | `Division` builds a dynamic Tailwind class (`h-${height}`). Tailwind cannot statically extract these — the class may be purged and produce no spacing. | `components/product/division.tsx` |
| F11 | Low | `animate-fadeIn` is applied to grid items but **is not defined** in `globals.css` — dead class, no animation. | `components/layout/product-grid-items.tsx` |
| F12 | Low | 48 files fail `prettier --check` at baseline (pre-existing). | repo-wide |
| F13 | Info | Shopify Storefront API pinned to `2023-01`. Supports `compareAtPriceRange`, variant `compareAtPrice`, and `metafield(namespace:key:)` — all changes below are compatible. | `lib/constants.ts` |

---

## 4. Change map — what was done

| Change | Files touched | Data dependency |
|---|---|---|
| **C1 · Sale pricing** — original struck through + red sale price + `−XX%` on cards and PDP | `fragments/product.ts`, `types.ts`, `lib/utils.ts` (`isOnSale`, `discountPercent`), `grid/tile.tsx`, `product-grid-items.tsx`, `product-description.tsx` | Shopify **Compare-at price** per variant |
| **C2 · Sale banner** — dismissible top bar, content-driven | new `components/layout/sale-banner.tsx`, `lib/shopify/index.ts` (`getSaleBanner`), `app/layout.tsx` | Shop metafields `custom.sale_banner_text` / `sale_banner_active` / `sale_banner_link` |
| **C3 · Mobile scroll fix** — gallery flows with page on mobile, keeps independent scroll at `lg+` | `components/product/gallery.tsx`, `app/product/[handle]/page.tsx` | none |
| **C4 · Measurements** — new PDP section (**PDP only, never on the card**) | `fragments/product.ts`, `types.ts`, new `components/product/measurements.tsx`, `product-description.tsx` | Product metafield `custom.measurements` |
| **C5 · Compact desktop filter** — horizontal pill bar above grid, full-width products | `app/shop/layout.tsx`, `collections.tsx`, new `filter/filter-bar.tsx` | none |
| **C6 · Meta/Instagram Pixel** — base + SPA PageView + ViewContent + AddToCart | new `components/analytics/meta-pixel.tsx`, `lib/analytics.ts`, `app/layout.tsx`, `add-to-cart.tsx`, `.env.example` | `NEXT_PUBLIC_META_PIXEL_ID` |
| **C7 · Article images + author** — full-bleed image breakout, two-up rows, `By {author}` | `app/installations/[handle]/page.tsx` | author = Shopify `authorV2` (edit per-article) |
| **C8 · Remove account** | `navbar-content.tsx` | none |
| **C9 · Hygiene** — remove debug log, fix `Division`, define `animate-fadeIn` | `product-description.tsx`, `division.tsx`, `globals.css` | none |

---

## 5. External configuration required (Tony)

| What | Where | Value |
|---|---|---|
| Sale prices | Shopify admin → product → variant → **Compare-at price** | Set higher than Price to mark an item on sale |
| Sale banner | Shopify admin → Settings → Custom data → **Shop** metafields | `custom.sale_banner_text` (single-line text), `custom.sale_banner_active` (boolean), `custom.sale_banner_link` (URL, optional) |
| Measurements | Shopify admin → Settings → Custom data → **Product** metafields | `custom.measurements` — JSON e.g. `{"Chest":"56 cm","Shoulder":"46 cm"}` or multiline text |
| Meta Pixel | `.env.local` **and** Vercel → Project → Settings → Environment Variables | `NEXT_PUBLIC_META_PIXEL_ID=<your id>` |
| Article author | Shopify admin → blog post → Author | Set per article |

---

## 6. Verification status

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | Passes clean, before and after |
| Prettier | All files touched by this work are formatted; repo-wide fix in a separate commit |
| `next build` | **Not runnable in the analysis sandbox** — Shopify egress is blocked there. Run locally. |
| Browser / Playwright | **Not runnable in the analysis sandbox** (same reason). Run `npx playwright test` locally — see `tests/storefront.spec.ts`. |
