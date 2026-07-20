# AGMNT — Design Prompt (scan + redesign UI)

Paste the block below into Claude's design tool (it has access to this repo). It scans the current code to learn the aesthetic, then redesigns only the surfaces that need UI/layout work — keeping the look identical.

---

```
REPO LOCATION: /Users/tonyg/Desktop/projects2026/commerce
(All file paths below are relative to that repo root.)

You have access to this repo (Next.js 15 + React 19 + Tailwind v4, Shopify-backed storefront for AGMNT, a monochrome avant-garde/archive fashion store) at /Users/tonyg/Desktop/projects2026/commerce. First SCAN the code to learn the existing visual language, then REDESIGN only the specific surfaces listed below. Do not restyle the whole site — the overall aesthetic must stay exactly the same.

STEP 1 — LEARN THE AESTHETIC (scan, don't change)
Read these files (relative to /Users/tonyg/Desktop/projects2026/commerce) to extract the current design language and reuse it verbatim:
- app/globals.css and tailwind setup (colors, spacing)
- fonts/ and how font-vremena is applied (localFont in app/layout.tsx)
- components/layout/navbar/navbar-content.tsx (uppercase labels, tracking)
- components/grid/tile.tsx, components/layout/product-grid-items.tsx (product cards)
- components/product/product-description.tsx, app/product/[handle]/page.tsx (PDP)
- components/layout/search/filter/* and app/shop/layout.tsx (filters)
- app/installations/[handle]/page.tsx (article page)
Capture: monochrome palette (white bg / black text), font-vremena, tight negative tracking (tracking-[-0.04em]), uppercase nav, hairline (0.5px) borders, generous whitespace, no shadows/gradients, no rounded corners on product imagery. These are non-negotiable constraints for everything you design.

STEP 2 — REDESIGN THESE SURFACES ONLY (mobile 390px + desktop 1440px for each)
1. Site-wide sale banner — a thin full-width bar at the very top (above the navbar): black bg, white text, small uppercase, wide letter-spacing, optional dismiss X. On/off + text is content-driven; design the "on" state.
2. Product card — sale state: original price struck through + muted, sale price in a single red accent, small "−XX%", and a small "SALE" tag on the image. Non-sale cards stay exactly as they are today. Show both states.
3. Product page (PDP) — mobile layout: the image gallery must flow with the page (stack + scroll naturally), with product info / variant selector / Add to Cart directly below in one continuous scroll — NOT a trapped inner scroll box. Keep the desktop two-column (independent gallery scroll) look unchanged. Also add a "Measurements" section BELOW the description (same section-label styling as the existing Product / Description blocks) rendered as a clean label-left / value-right table. Measurements appear on the PDP ONLY — never on the product card.
4. Desktop shop filter — replace the tall 200px left sidebar with a compact horizontal filter bar above the grid: small dropdown pills (Category, Brand, Color, Sort) with chevrons + a reset and a piece count, so products use the full page width. Keep the existing mobile filter dropdown pattern. Match hairline-border, uppercase-label styling.
5. Article page (installations) — richer image placement: let body images break out wider than the text column (up to near-full-bleed) while paragraphs stay at readable width, and support a two-up image row on desktop that stacks on mobile. Keep the "By {author}" meta line, monochrome look, and font-vremena.

DO NOT redesign: overall color scheme, typography, homepage hero, navbar structure (beyond removing the account link), footer, cart. No new fonts, no new colors except the single red sale accent. No shadows, gradients, or rounded product images.

STEP 3 — DELIVER
For each of the 5 surfaces, produce mobile + desktop mockups grounded in the scanned styles, plus short notes on which Tailwind classes / tokens map to each change so it translates cleanly back to the components above. Flag anywhere the redesign would require a data change (e.g. sale pricing needs Shopify compare-at price; measurements need a per-product metafield).
```

---

**Scope reminder:** account removal and the Meta Pixel are code-only tasks (no design) and are handled in `AGMNT_FIX_PROMPTS.md`, so they're intentionally left out of this design prompt.
