# AGMNT Storefront — Claude Code Fix Pack

A sequenced set of prompts to feed into **Claude Code** (which has your `playwright` MCP + repo access) to fix the storefront's mobile UX, add sale pricing, and more.

## How to use this file

1. Open Claude Code in the repo: `cd ~/Desktop/projects2026/commerce`
2. Start your dev server in a separate terminal: `bun dev` — note the URL (usually `http://localhost:3000`).
3. Feed the prompts below **one at a time**, in order. Wait for each to finish, review the diff, and confirm it works before moving on.
4. Each prompt ends with a **Playwright test** step. Claude Code will drive the browser at both a mobile (390×844) and desktop (1440×900) viewport. Watch it, then commit.
5. Commit after each fix: `git add -A && git commit -m "..."`. This keeps changes isolated and easy to roll back.

**Do PROMPT 0 first** — it establishes a baseline and confirms Playwright works before any code changes.

---

## Repo facts (already scanned — paste into Claude Code if it asks)

- **Stack:** Next.js 15 (App Router, canary), React 19, Tailwind CSS v4, TypeScript. Shopify Storefront API backend. Deployed on Vercel. Package manager: **bun** (`bun.lock`).
- **Data layer:** `lib/shopify/` — `index.ts` (fetchers), `types.ts`, `fragments/`, `queries/`.
- **"Installations"** = the blog/article section (`app/installations/`).
- **Brand aesthetic:** monochrome brutalist — white bg, black text, `font-vremena`, uppercase nav labels, tight tracking (`tracking-[-0.04em]`). Match this in every change; no new colors except a single sale-accent (red).
- **Existing metafield pattern:** `getShopMetafield("custom", "homepage_video")` is already used in `app/layout.tsx` — reuse this pattern for the sale banner.

---

## PROMPT 0 — Baseline + Playwright smoke test

```
Before we make any changes, establish a baseline. My dev server is running at http://localhost:3000 (confirm the port).

Using the playwright MCP:
1. Load the homepage, /shop, a single product page (open the first product from /shop), and one /installations article — at BOTH a mobile viewport (390x844) and desktop (1440x900).
2. For each page + viewport, take a screenshot and note anything visibly broken, plus console errors.
3. Pay special attention to the product page on MOBILE: try to scroll from the top of the page down to the "Add to cart" button and the description. Report exactly what happens to the scroll (this is a known bug we'll fix later).

Give me a short written baseline report grouped by page. Do not change any code yet.
```

---

## PROMPT 1 — Remove the account section

```
Remove the customer "account" section from the site entirely.

File: components/layout/navbar/navbar-content.tsx
- Remove the ACCOUNT_URL constant.
- Mobile navbar: remove the account <a> with the UserIcon (and drop the now-unused UserIcon import from @heroicons/react if nothing else uses it).
- Desktop navbar: remove the "ACCOUNT" <a> link.
- Keep search and cart exactly as they are; keep spacing balanced after removal.

Then grep the whole repo for other references to "account" (case-insensitive) and remove/av any leftover links or menu items pointing to /account, so nothing dangling remains.

Test with Playwright at mobile (390x844) and desktop (1440x900): load the homepage, confirm the account icon/link is gone from both navbars, search + cart still open, no console errors, and layout/spacing looks right. Screenshot both.
```

---

## PROMPT 2 — Sale pricing: data layer + UI (compare-at price)

> This is the biggest change. The GraphQL query does **not** currently fetch compare-at prices, so this touches the data layer first, then three UI spots.

```
Add "on sale" pricing that shows the original price struck through next to the discounted price. Sale data comes from Shopify's native Compare-at price field. Work in this order:

DATA LAYER
1. lib/shopify/fragments/product.ts — add to the `product` fragment:
   - `compareAtPriceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }`
   - inside variants(...) node, add `compareAtPrice { amount currencyCode }`
2. lib/shopify/types.ts — extend the Product type with `compareAtPriceRange` (same shape as priceRange, values may be null) and add `compareAtPrice: Money | null` to the variant type. Update the ShopifyProduct type / reshaping in lib/shopify/index.ts if it maps fields explicitly so the new fields survive.
3. Add a small helper (e.g. in lib/utils.ts) `isOnSale(compareAt, price)` returning true when compareAt is present and greater than price, plus `discountPercent(compareAt, price)` returning a rounded integer.

UI (match the monochrome brand; sale accent = a single red, e.g. text-red-600)
4. components/grid/tile.tsx — the product card label: when the product is on sale, render the compare-at amount with line-through + muted, then the sale amount in the red accent, and a small "−XX%". Also add a small "SALE" tag in the top-left of the image container. When NOT on sale, render exactly as today (single price).
5. components/layout/product-grid-items.tsx — pass the compare-at data through to the label so tile.tsx can use it.
6. components/product/product-description.tsx — the PDP price block: same treatment (struck original + red sale price). Keep "Taxes and duties included".
7. While you're in product-description.tsx, delete the stray `console.log('Product data', ...)` debug block at the top.

Keep formatting consistent with the existing Intl currency formatting.

Test with Playwright at mobile + desktop: I'll need at least one product with a Compare-at price set in Shopify — if none exists, tell me and I'll set one, OR temporarily mock a compareAtPrice in the fetcher to verify the UI, then revert the mock. Verify: sale items show strike-through + red sale price + % on both the /shop grid card and the product page; non-sale items look unchanged. Screenshot a sale card and a sale PDP on both viewports.
```

**Note:** if you haven't set any Compare-at prices in Shopify yet, do it in Shopify admin: edit a product/variant → set **Compare-at price** higher than the **Price**. That's what marks something "on sale."

---

## PROMPT 3 — Site-wide sale banner (metafield-controlled)

```
Add a dismissible site-wide sale banner across the top of every page, controlled from Shopify so I can turn it on/off and edit the text without a redeploy — same pattern as the existing homepage_video metafield.

1. Define a shop metafield convention: namespace "custom", keys `sale_banner_text` (single line text) and optionally `sale_banner_active` (boolean) and `sale_banner_link` (url). Use the existing getShopMetafield helper in lib/shopify to fetch them (add a helper if needed).
2. Create components/layout/sale-banner.tsx: a thin full-width bar, black background / white text, centered, small uppercase text with wide letter-spacing to match the brand. If sale_banner_active is false or the text is empty, render nothing. If a link is set, wrap it. Include a small dismiss (X) button that hides it for the session (client component, useState — do NOT use localStorage).
3. Mount it in app/layout.tsx ABOVE <Navbar /> so it sits at the very top. Make sure the navbar's sticky/offset (if any) still looks correct beneath it.
4. Keep it lightweight — no layout shift, works with the persistent hero.

Test with Playwright at mobile + desktop: temporarily have the fetch return sample text ("VAULT CLEARANCE — UP TO 40% OFF") to verify rendering, then confirm the empty/inactive case renders nothing. Check the dismiss button hides it and nothing overlaps the navbar/logo. Screenshot both viewports with the banner on.
```

To turn it on later: Shopify admin → Settings → Custom data → **Shop** metafields → add `custom.sale_banner_text` (and `sale_banner_active`), fill in the copy.

---

## PROMPT 4 — Fix the mobile product-image scroll trap

> Root cause confirmed: on the product page the gallery is a fixed `h-[97.5vh]` box and `gallery.tsx` is an internal `overflow-y-auto` scroller. On mobile that captures the swipe so you can't reach description/add-to-cart.

```
Fix the product page mobile scroll bug. Files: app/product/[handle]/page.tsx and components/product/gallery.tsx.

Current behavior: on mobile the left gallery is a fixed-height (h-[97.5vh]) internal scroll container (gallery.tsx uses h-[95%] overflow-y-auto). This traps the touch scroll so the description and Add to Cart below are hard to reach.

Desired behavior:
- MOBILE (below lg): the gallery should NOT be an independent scroll area. Images stack vertically and scroll naturally with the whole page; the product info (description, variant selector, Add to Cart) follows directly below in normal document flow. One continuous page scroll from first image to Add to Cart.
- DESKTOP (lg and up): keep the current two-column layout where the gallery has its own independent scroll next to the sticky-ish product info. Preserve today's desktop feel.

Implementation: make the fixed height and overflow-y-auto apply only at lg+ (e.g. gallery wrapper `lg:h-[97.5vh]` and inner `lg:h-[95%] lg:overflow-y-auto`, with mobile being height-auto / no overflow). Adjust app/product/[handle]/page.tsx grid so the mobile single-column flows naturally. Don't change desktop behavior.

Test with Playwright at mobile (390x844): load a product page, then scroll from the very top all the way to the Add to Cart button in one continuous gesture and confirm it's reachable without fighting a nested scroller. Then at desktop (1440x900) confirm the two-column layout and independent gallery scroll still work. Screenshot both. Record the scroll as a gif if the tool supports it.
```

---

## PROMPT 5 — Add a Measurements section to the product page (metafield per product)

```
Add a "Measurements" section to the product page, sourced from a per-product Shopify metafield so each garment can have its own flat-lay measurements.

1. Data: fetch a product metafield `custom.measurements` in the product query. In lib/shopify/fragments/product.ts add a metafields selection (e.g. `metafield(namespace: "custom", key: "measurements") { value type }`), and thread it into the Product type in lib/shopify/types.ts. Support two content shapes gracefully: (a) a JSON object of label→value pairs, and (b) plain multiline text / HTML. Parse JSON if type is json, otherwise render the text.
2. UI: in components/product/product-description.tsx add a third section after Description, using the same `Cookie index={3} text="Measurements"` pattern already used for Product/Description. Render a clean two-column key/value table (label left, value right) when JSON, or the text/HTML block otherwise. Match font-vremena, small text, tight tracking. If the metafield is empty, render nothing (no empty header).
3. Keep it consistent with the existing Division spacing rhythm.

Test with Playwright at mobile + desktop: use a product that has the measurements metafield set (or tell me to add one, or temporarily mock the value to verify UI then revert). Confirm the section renders below Description, is readable on mobile, and is hidden when no data. Screenshot both.
```

To populate later: Shopify admin → product → Metafields → `custom.measurements`. Use JSON like `{"Chest":"56 cm","Shoulder":"46 cm","Length":"68 cm"}` or plain text.

---

## PROMPT 6 — Compact the desktop filter (reclaim the sidebar)

```
Rework the desktop shop filters to take less space. Today app/shop/layout.tsx reserves a md:max-w-[200px] left sidebar column, and components/layout/search/filter/index.tsx renders a tall vertical list (hidden md:block). Mobile already uses a compact dropdown (components/layout/search/filter/dropdown.tsx).

Goal: on desktop, replace the tall left sidebar with a compact horizontal filter bar ABOVE the product grid — a row of small dropdown pills: Category, Brand, Color, Sort — plus a lightweight "reset" and a piece count on the right. Products then use the full page width.

1. app/shop/layout.tsx — remove/collapse the fixed left sidebar column on desktop; make the grid area full width. Keep it responsive.
2. components/layout/search/collections.tsx already builds the sections (Categories, Brands, Colors) for the mobile dropdown — reuse that same data to render the new desktop bar. Consider generalizing the existing dropdown.tsx so it works for both a single compact desktop bar and mobile, or add a compact desktop variant. Preserve all current filter behavior and URLs (?vendor=, ?color=, category paths, sort).
3. Keep the brand look: hairline borders, uppercase small labels, chevron icons, no heavy chrome.
4. Don't break the mobile experience — mobile should keep working as-is (or share the improved component).

Test with Playwright at desktop (1440x900): load /shop, confirm the filter bar is horizontal/compact, the grid spans full width, and each dropdown filters correctly (apply a brand and a color, confirm the URL + results update, then reset). At mobile (390x844) confirm filtering still works. Screenshot both.
```

---

## PROMPT 7 — Install the Meta Pixel

```
Install the Meta (Facebook) Pixel across the site.

1. Add NEXT_PUBLIC_META_PIXEL_ID to .env.local and .env.example (I will paste the real ID). Read it from the environment; if it's unset, render nothing (so dev/previews without an ID don't fire).
2. In app/layout.tsx, load the pixel using the Next.js `next/script` component (strategy="afterInteractive") with the standard fbevents snippet, plus the <noscript> fallback img. Fire the base PageView.
3. Because this is an App Router SPA, add a small client component that fires `fbq('track', 'PageView')` on route changes (usePathname/useSearchParams in a useEffect) so client-side navigations are counted. Mount it in the layout.
4. Add a ViewContent event on the product page and an AddToCart event when the Add to Cart action succeeds (components/cart/add-to-cart.tsx / actions) — guard all fbq calls so they no-op when the pixel isn't loaded.

Test with Playwright at desktop: load the site with a test NEXT_PUBLIC_META_PIXEL_ID set, and use the network panel to confirm requests to facebook.com/tr fire on initial load, on a client-side navigation, and on add-to-cart. Confirm nothing fires and no errors occur when the env var is absent. Report the observed events.
```

You'll get the Pixel ID from Meta Events Manager → Data Sources → your pixel. Paste it into `.env.local` as `NEXT_PUBLIC_META_PIXEL_ID=...` and into Vercel's env vars for production.

---

## PROMPT 8 — Article page: more image placement + author

```
Improve the installations article page: app/installations/[handle]/page.tsx.

AUTHOR: The author already renders from Shopify authorV2.name. Keep it dynamic (I'll set the author per article in Shopify admin), but: (a) make sure it always displays when present and gracefully hides when empty, and (b) add a clear "By {name}" label styling consistent with the brand meta row. Confirm the query (lib/shopify/queries/blog.ts) and Article type already carry author.name (they do) — no schema change needed unless something's missing.

IMAGES / LAYOUT: right now the body is a single prose column and images come only from the Shopify rich-text contentHtml (limited layout control). Improve image placement options:
1. Widen image treatment: allow images inside the article body to break out to a wider, near-full-bleed width (not just the max-w-3xl text column), while keeping paragraphs at readable width. Use the prose styles / a wrapper so <img> and <figure> can go full-width.
2. Support a simple two-up / gallery layout: if the Shopify content uses a known wrapper (e.g. consecutive images, or a <figure> group), render them side-by-side on desktop and stacked on mobile. Pick a robust approach that works with what Shopify's editor outputs.
3. Optionally support an extra images metafield (custom.gallery) rendered as a responsive grid at the end of the article, if that's easier than parsing inline content — implement whichever gives me the most flexible image placement. Explain what you chose.

Keep font-vremena, tight tracking, and the monochrome look. Don't break existing articles.

Test with Playwright at mobile + desktop: open an existing article, confirm author shows as "By {name}", images can render wider than the text column, and any multi-image layout stacks on mobile. Screenshot both.
```

---

## PROMPT 9 — General mobile polish pass

```
Do a focused mobile usability pass at 390x844 (and spot-check 360px). Using Playwright, walk these flows and fix issues you find, keeping the monochrome brand intact:

- Home: hero/video, ticker, any horizontal overflow (nothing should scroll sideways), tap targets not too small.
- Navbar: logo, search, cart, menu all reachable and not overlapping; the new sale banner sits correctly above.
- /shop: grid spacing, the mobile filter dropdown opens/closes and doesn't get clipped, product cards + sale prices legible.
- Product page: confirm the scroll fix from PROMPT 4 holds, variant selector is tappable, Add to Cart reachable, measurements readable.
- Cart modal: opens, scrolls, checkout button reachable.
- Footer/newsletter: inputs usable on mobile.

For each issue, show me the before screenshot, the fix, and the after screenshot. Prioritize anything that blocks reaching Add to Cart or checkout. Don't touch desktop layouts unless a fix is shared.
```

---

## PROMPT 10 — Final regression + build check

```
Final pass before I deploy:
1. Run the full flow with Playwright at mobile (390x844) and desktop (1440x900): home → /shop → apply a filter → open a product → view measurements → add to cart → open cart. Confirm no console errors and no broken layouts. Screenshot each key step for both viewports.
2. Confirm the sale banner, sale prices, removed account section, compact desktop filter, and Meta Pixel all still work together.
3. Run `bun run build` and fix any type or build errors introduced by our changes.
4. Give me a summary of everything changed, grouped by feature, and the git commits.
```

---

## Suggested order & commit messages

1. Baseline (no commit)
2. `fix: remove account section from navbar`
3. `feat: show compare-at sale pricing on cards and PDP`
4. `feat: metafield-controlled site sale banner`
5. `fix: mobile product gallery scroll trap`
6. `feat: product measurements section from metafield`
7. `refactor: compact desktop shop filter bar`
8. `feat: install meta pixel with SPA pageview + events`
9. `feat: wider article images + author display`
10. `chore: mobile polish pass`
11. `chore: final regression + build fixes`

Do the account removal and the mobile scroll fix first if you want the fastest visible wins — they're low-risk and high-impact.
