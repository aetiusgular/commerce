# AGMNT — Conversion Front Page (Design Prompt)

Paste the block below into Claude design. It produces reference files (HTML/CSS/JSX, same format as the Shop/Product/Cart references) that can be ported straight into the Next.js storefront.

---

```
REPO LOCATION: /Users/tonyg/Desktop/projects2026/commerce
(All paths below are relative to that repo root. You have file access — scan before designing.)

CONTEXT — READ FIRST
AGMNT (pronounced "augment") is a Los Angeles retailer of avant-garde designers:
Notinlist, Aesynctx, XLIM, Post Archive Faction (PAF), AVAVAV, Kozaburo,
11 by Boris Bidjan Saberi, Aenrmous, Veerkracht, plus AGMNT Archive pieces.
Business situation, which the design must serve:
- Most of this inventory is SOLD OUT at every other stockist worldwide; AGMNT is
  the last stockist with stock, often at the lowest price (site-wide sale is live,
  with real compare-at strike-through pricing).
- The current homepage is a full-screen video/gallery "culture hub" (radio,
  ticker, editorial) that buries the shop. The business goal right now is PURE
  CONVERSION: get a visitor from landing → product → add to bag in as few
  moves as possible, and put the last-stockist/sale advantage in their face.
- Traffic will increasingly arrive from Google Shopping, exact product-name
  searches, and Instagram — visitors who already want a specific piece. The
  homepage must not make anyone hunt.

STEP 1 — SCAN THE EXISTING DESIGN SYSTEM (do not restyle it)
Read these files and reuse their visual language exactly:
- app/globals.css → the .agmnt-shop / .agmnt-pdp / .agmnt-cart sections:
  WHITE #ffffff background, ink #0a0a0a, muted #8a8a85, hairlines
  rgba(10,10,10,0.16), single red accent oklch(0.52 0.17 28) used ONLY for
  sale prices / SALE tags, Vremena font, uppercase micro-labels with wide
  letter-spacing, 1px rules, NO rounded corners, NO shadows, NO gradients.
- components/shop/shop-card.tsx + .scard styles → the product card (borderless
  3/4 image, hover crossfade to second image, brand over name, muted price,
  sale = struck gray + red). REUSE THIS CARD AS-IS in the homepage grid.
- components/layout/navbar/navbar-content.tsx (SHOP / INSTALLATIONS / logo /
  SEARCH / CART) and components/layout/sale-banner.tsx (thin black bar) —
  keep both; design assumes they sit above the page.
- app/shop, app/product/[handle], app/cart pages — the homepage must feel like
  the same store as these.

STEP 2 — DESIGN THE FRONT PAGE (desktop 1440 + mobile 390)
One goal: conversion. Every section either shows product or removes a doubt.
Order and spec:

1. SALE BANNER (existing component, black bar): assume text like
   "ARCHIVE SALE — UP TO 50% OFF · LAST STOCK OF SOLD-OUT PIECES".

2. HERO — COMMERCE, NOT CINEMA. No autoplay video, no full-viewport art.
   A compact statement band (max ~45vh desktop, less on mobile):
   - H1: "The last stockist." with a supporting line:
     "Sold out at every other retailer. In stock here — on sale, shipped from
     Los Angeles." (italic muted em treatment like the shop hero style).
   - Primary CTA: solid ink button "SHOP THE SALE →" to /shop?sale=1.
     Secondary text link: "Browse all pieces →" to /shop.
   - Small entity line under the CTAs: "AGMNT — pronounced 'augment'. Est. Los
     Angeles." (this disambiguation is deliberate; keep it subtle, muted, 10px
     uppercase).
   - Optional: one product image strip or single striking product photo to the
     right on desktop — but product, not mood.

3. PROOF STRIP — one hairline-bounded row of three or four micro-items, 10px
   uppercase muted: "LAST-UNIT STOCK OF SOLD-OUT PIECES" · "SHIPS WITHIN 48H
   FROM LA" · "30-DAY RETURNS" · "SECURE CHECKOUT (SHOP PAY)".

4. ON SALE NOW — the workhorse. Grid of 6–8 product cards (the existing
   .scard, with SALE tags and struck pricing visible). Section head:
   "On sale now" + count + "View all →" to /shop?sale=1. This section starts
   high enough that on desktop the first card row is visible without
   scrolling past the hero.

5. LAST UNITS — a smaller, urgency-framed row (3–4 cards) for pieces tagged
   'last pair' / final size runs. Section head: "Last units — when it's gone,
   it's gone." Cards can show a small ink "LAST PAIR" tag (already exists).

6. SHOP BY DESIGNER — the router for people who arrived hunting a brand.
   A hairline-divided list or compact grid of the 9 designer names (typographic,
   no images necessary; small piece-count per designer, e.g. "Notinlist — 12
   pieces"), each linking to its designer page (/shop/<collection>). Include a
   one-line lead-in: "Official stockist. Every piece authenticated and shipped
   from our LA studio."

7. ONE editorial hook only — a single wide banner card for Installations
   ("From the journal — read the stories behind the racks →"), image +
   headline, nothing more. It must not compete with commerce; place it low.

8. NEWSLETTER CAPTURE — one line above the footer: "Restocks and final drops,
   first. No noise." + email input + REGISTER (reuse the existing footer
   newsletter styling if present).

9. FOOTER — existing footer; assume unchanged.

MOBILE RULES
- Hero collapses to text + CTA (no side image), ~35vh max.
- Grids: 2-up cards; designer list single column; proof strip wraps to 2×2.
- The "SHOP THE SALE" CTA must be visible without any scroll on a 390×844
  viewport.

HARD CONSTRAINTS
- Background #ffffff everywhere. Ink/muted/hairline tokens from the scan.
  Red accent ONLY on sale prices/tags — never on CTAs (CTAs are solid ink).
- Real data only: no fake reviews, no fake scarcity counters, no countdown
  timers. Urgency comes from true facts (last stockist, last units, real
  markdowns).
- No autoplay video, no carousel/slider heroes, no parallax. Fast and static.
- Keep radio/ticker/culture elements OFF this page (they live elsewhere).
- Tone: brutalist-editorial, terse, factual. E.g. "Sold out everywhere else.
  In stock here." — no marketing fluff, no exclamation marks.

DELIVERABLES
Reference files in the same format as the previous Shop/Product/Cart mockups:
- "AGMNT Home Conversion.html" + "home.css" + "app-home.jsx"
  (self-contained React mockup with placeholder product data matching the real
  catalog names/prices above, both breakpoints handled in CSS).
- A short IMPLEMENTATION NOTES section at the top of the JSX mapping each
  section to the existing components it should reuse (.scard, sale-banner,
  navbar, footer) so it ports cleanly into app/page.tsx.
```

---

**Scope note:** this replaces the current homepage's video/gallery hub for the liquidation period. The persistent hero video, radio, and ticker components stay in the codebase (they can return post-recovery) — the design just doesn't use them on `/`.
