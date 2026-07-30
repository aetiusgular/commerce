# AGMNT — Site SEO Fix Prompts (code-side, ordered)

Derived from `AGMNT_SEO_Revenue_Plan.md`. These are the fixes that live **in the
repo**. External steps (Search Console verification, Merchant Center feed,
marketplace listings, Google Business Profile, Wikidata edits) are listed at the
end — they can't be done from code.

Run in order. After each, verify with `bun run typecheck` + `bun run prettier`
and the stated check. Nothing here changes the storefront's look — it's
indexing/entity plumbing.

Canonical facts this set assumes (verified):
- TLD (.space) is not the problem; **do not migrate domains**.
- Next.js `next.config` redirects with `permanent: true` return HTTP 308, which
  Google treats as a permanent redirect (equivalent to 301 for consolidation).
- Structured data must reflect reality only (real prices, real availability).

---

## PROMPT 1 — Canonical site URL + metadataBase + per-page canonical

```
The site is indexed under both agmnt.space and www.agmnt.space, and baseUrl is
derived from VERCEL_PROJECT_PRODUCTION_URL (not guaranteed to be the real
domain). Make the canonical origin explicit and correct.

1. lib/utils.ts: change `baseUrl` to prefer an explicit env:
   process.env.NEXT_PUBLIC_SITE_URL || (VERCEL_PROJECT_PRODUCTION_URL ? https://… ) || http://localhost:3000
   Normalize: no trailing slash.
2. .env.example and .env.local: add NEXT_PUBLIC_SITE_URL="https://agmnt.space".
3. app/layout.tsx: metadataBase already uses baseUrl — confirm it now resolves
   to https://agmnt.space in production. Add alternates.canonical: "/" to the
   root metadata so the homepage self-canonicalizes.
4. Add `alternates: { canonical: "/product/<handle>" }` to the product page
   generateMetadata and `/shop/<collection>` to the collection generateMetadata,
   and canonical "/shop" to the shop page metadata, so every route emits a
   correct absolute canonical (resolved against metadataBase).

Verify: grep that NEXT_PUBLIC_SITE_URL is read; typecheck clean; confirm
generateMetadata returns alternates.canonical on product + collection.
NOTE (external): the actual www → non-www 301 is a Vercel domain setting — I'll
list it in the external checklist; code just makes canonical consistent.
```

## PROMPT 2 — Legacy Shopify URL redirects

```
Old indexed URLs use Shopify paths that now 404 on the Next.js site, stranding
all existing index equity and showing stale prices. Add permanent redirects in
next.config.ts (async redirects()):
- source "/products/:handle"      → destination "/product/:handle"   permanent
- source "/collections/:handle"   → destination "/shop/:handle"      permanent
- source "/collections"           → destination "/shop"              permanent
- source "/pages/:handle"          → destination "/:handle"          permanent
Keep the existing config (experimental, images) intact — just add redirects().

Verify: typecheck clean; print the redirects array; confirm no duplicate/source
collisions with real routes (there is no /products or /collections route in app/).
```

## PROMPT 3 — Product structured data (rich results + sale)

```
Rewrite the product JSON-LD in app/product/[handle]/page.tsx to full schema.org
Product so Google can show "In stock · $X · AGMNT" rich results and connect to
the shared product entity:
- name, description, image (all product images if available), sku/mpn if present.
- brand: { "@type": "Brand", name: product.vendor }.
- offers: a single Offer when min==max price, else AggregateOffer with
  lowPrice/highPrice/offerCount. Each offer includes:
  price (the CURRENT/sale price = priceRange.minVariantPrice.amount),
  priceCurrency, availability (InStock when availableForSale else OutOfStock),
  itemCondition "https://schema.org/NewCondition",
  url (canonical product URL),
  priceValidUntil (~1 year out).
- seller: { "@type": "Organization", name: "AGMNT" }.
Use absolute URLs (baseUrl). Keep it a server-rendered <script type=application/ld+json>.

Verify: typecheck clean; JSON.stringify output is valid JSON; brand/seller/
itemCondition/price present; availability reflects product.availableForSale.
```

## PROMPT 4 — Organization + WebSite JSON-LD (entity disambiguation)

```
"AGMNT" competes with agmnt.com and agmnt.app in search, and the name is
mispronounced. Emit sitewide entity markup in app/layout.tsx <head> (server):
1. Organization:
   name "AGMNT",
   alternateName ["Augment", "AGMNT Store"],
   url baseUrl,
   logo `${baseUrl}/images/AGMNT-logo-black.png`,
   address { "@type": PostalAddress, addressLocality "Los Angeles",
             addressRegion "CA", addressCountry "US" },
   sameAs: [ process.env.NEXT_PUBLIC_WIKIDATA_URL (if set),
             "https://www.instagram.com/agmnt_store/",
             "https://www.facebook.com/p/AGMNT-Store-61567711654132/",
             "https://www.linkedin.com/company/agmnt-store" ].filter(Boolean)
2. WebSite:
   name "AGMNT", url baseUrl,
   potentialAction SearchAction target `${baseUrl}/shop?q={search_term_string}`.
Add NEXT_PUBLIC_WIKIDATA_URL to .env.example (blank) with a comment to paste the
Wikidata item URL. Render both as one or two <script type=application/ld+json>.

Verify: typecheck clean; valid JSON; sameAs drops empty entries; logo + search
URLs are absolute.
```

## PROMPT 5 — Sitemap completeness + robots

```
The sitemap omits editorial articles and the robots file is bare.
1. app/sitemap.ts: add installations articles via getArticles() →
   `${baseUrl}/installations/${handle}` with lastModified = publishedAt. Keep
   home, collections, products, pages. Ensure all URLs use the canonical baseUrl.
2. app/robots.ts: keep allow-all, ensure `sitemap: ${baseUrl}/sitemap.xml` and
   `host: baseUrl`; add `disallow: ["/api/"]`.

Verify: typecheck clean; sitemap function references getArticles; robots outputs
canonical host + sitemap.
```

## PROMPT 6 — Hunt-query metadata (PDP + collection copy)

```
Buyers search exact product/designer names + "in stock". Tune metadata (not
visible layout):
1. app/product/[handle]/page.tsx generateMetadata:
   title = `${product.vendor ? product.vendor + " " : ""}${product.title}` and
   rely on the layout template "%s | AGMNT"; if seo.title exists keep it.
   description = seo.description || a factual line:
   `${product.title} by ${product.vendor} — in stock at AGMNT. Ships from Los Angeles.`
   openGraph already set; keep.
2. app/shop/[collection]/page.tsx generateMetadata:
   title = `${collection.title}` (template appends AGMNT),
   description = collection.seo?.description || collection.description ||
   `Shop ${collection.title} in stock at AGMNT — official stockist, ships from Los Angeles.`
   Add a short indexable intro <p> above the grid: one factual sentence naming
   the collection + "official stockist / ships from LA" (muted, small, matches
   .shop styling). No keyword stuffing.
Keep everything factual — no fake claims.

Verify: typecheck clean; metadata objects return title+description; intro copy
renders only when a collection exists.
```

## PROMPT 7 — Verify + external checklist

```
Run bun run typecheck and bun run prettier — both clean. Run bun run build
locally (Shopify must be reachable) and fix any errors. Then confirm the
external, non-code steps below are done — they are where most of the traffic
recovery actually happens:

EXTERNAL (cannot be done in the repo):
[ ] Vercel: set agmnt.space as the primary domain; 301 www → non-www.
[ ] Vercel env: NEXT_PUBLIC_SITE_URL=https://agmnt.space (Production).
[ ] Google Search Console: verify agmnt.space (domain property); submit sitemap;
    URL-inspect + Request Indexing on the top ~20 product pages.
[ ] Google Merchant Center: create account, verify domain, connect the Shopify
    Google & YouTube app feed, override product link to agmnt.space/product/…,
    fix apparel attributes (color/size/age_group/gender/category), enable free
    listings + sale_price. (Highest-revenue step.)
[ ] Paste the Wikidata item URL into NEXT_PUBLIC_WIKIDATA_URL; confirm the
    Wikidata item lists official website + socials + alias "Augment".
[ ] Google Business Profile: "AGMNT — fashion store, Los Angeles".
[ ] Cross-list top items on Grailed / eBay / TikTok Shop.
```

---

## Execution log

All six code prompts executed on the `feat/storefront-overhaul` branch.
TypeScript (`tsc --noEmit`) and Prettier are clean after every step. `next build`
could not be run here (Shopify egress is blocked in the analysis sandbox) — run
it locally before deploy.

- **P1 — Canonical URL** ✅ `lib/utils.ts` now reads `NEXT_PUBLIC_SITE_URL` first
  (trailing slash stripped); added the var to `.env.example` + `.env.local`
  (`https://agmnt.space`). `alternates.canonical` added to the root layout ("/"),
  product (`/product/<handle>`), collection (`/shop/<handle>`), and shop ("/shop").
- **P2 — Legacy redirects** ✅ `next.config.ts` `redirects()` added: `/products/:handle`,
  `/collections`, `/collections/:handle`, `/pages/:handle` → new routes (308 permanent).
  Confirmed no collision with real app routes.
- **P3 — Product schema** ✅ Full `Product` JSON-LD: `brand`, `seller` (AGMNT
  Organization), `itemCondition` NewCondition, `priceValidUntil`, canonical `url`,
  all images, Offer/AggregateOffer by price shape, availability from
  `availableForSale`. Sale price flows through (offer price = current min price).
- **P4 — Entity markup** ✅ Sitewide `Organization` (alternateName ["Augment",
  "AGMNT Store"], LA address, logo, `sameAs` → Wikidata env + IG/FB/LinkedIn) and
  `WebSite` (SearchAction → `/shop?q=`) in `app/layout.tsx` head. Added
  `NEXT_PUBLIC_WIKIDATA_URL` env (blank — paste the item URL).
- **P5 — Sitemap + robots** ✅ Sitemap now includes `/shop`, `/installations`, and
  every article; robots allows `/`, disallows `/api/`, points to sitemap + host.
- **P6 — Hunt-query metadata** ✅ PDP title = `<designer> <product>` (template adds
  "| AGMNT"), factual in-stock description; collection description = "official
  stockist… ships from Los Angeles" + an indexable intro line above the grid.

**Not done here (external, highest-traffic — see P7 checklist):** Search Console,
Merchant Center feed, Vercel primary-domain + www→non-www 301, Wikidata URL,
Google Business Profile, marketplace listings.
