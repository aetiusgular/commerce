"use client";

import { ShopCard } from "components/shop/shop-card";
import { BRANDS } from "lib/brands";
import {
  categoriesOf,
  colorOf,
  computeFacets,
  type InitialShopFilters,
  priceNum,
  productIsOnSale,
} from "lib/shop-facets";
import type { Product } from "lib/shopify/types";
import { colorHex } from "lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const STEP = 10;
const SORTS = [
  "Latest arrivals",
  "Price — low to high",
  "Price — high to low",
  "Discount — high to low",
] as const;
type Sort = (typeof SORTS)[number];

// URL slugs for each sort (the default sort is left off the URL entirely).
const SORT_SLUGS: Record<Sort, string> = {
  "Latest arrivals": "",
  "Price — low to high": "price-asc",
  "Price — high to low": "price-desc",
  "Discount — high to low": "discount",
};

type Dim = "cats" | "designers" | "colors";
type Filters = {
  cats: string[];
  designers: string[];
  colors: string[];
  range: [number, number];
  sale: boolean;
  sort: Sort;
};

const discountOf = (p: Product): number => {
  const was = parseFloat(p.compareAtPriceRange?.minVariantPrice?.amount ?? "0");
  const now = priceNum(p);
  return was > now && was > 0 ? 1 - now / was : 0;
};

const hit = (p: Product, dim: Dim, v: string): boolean => {
  if (dim === "cats") return categoriesOf(p).includes(v);
  if (dim === "designers") return p.vendor === v;
  return colorOf(p).includes(v);
};

/**
 * Shop browser — v7 index rail. Client-side multi-select filtering over the
 * product list the server already fetched: Status / Category / Designer /
 * Colour / Price + Order, with skip-self counts, a dual-thumb price range, and
 * a full-screen Filter & sort sheet below 900px. Filtering lives here so the
 * counts, the price slider and the grid all stay in exact sync.
 */
export function ShopBrowser({
  products,
  initial,
  brandHrefs,
}: {
  products: Product[];
  initial?: InitialShopFilters;
  brandHrefs?: Record<string, string>;
}) {
  const facets = useMemo(() => computeFacets(products), [products]);

  const [priceMin, priceMax] = useMemo(() => {
    const nums = products.map(priceNum);
    const lo = Math.floor(Math.min(...nums) / STEP) * STEP;
    const hi = Math.ceil(Math.max(...nums) / STEP) * STEP;
    return [Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : 0];
  }, [products]);

  // Seed filter state from the URL (parsed server-side into `initial`), clamped
  // to what actually exists in this catalogue so a stale link never breaks.
  const [f, setF] = useState<Filters>(() => {
    const keep = (vals: string[] | undefined, allowed: string[]) =>
      (vals ?? []).filter((v) => allowed.includes(v));
    const lo =
      typeof initial?.min === "number" && initial.min >= priceMin
        ? initial.min
        : priceMin;
    const hi =
      typeof initial?.max === "number" && initial.max <= priceMax
        ? initial.max
        : priceMax;
    return {
      cats: keep(initial?.cats, facets.categories),
      designers: keep(initial?.designers, facets.designers),
      colors: keep(initial?.colors, facets.colors),
      range: [Math.min(lo, hi), Math.max(lo, hi)],
      sale: Boolean(initial?.sale),
      sort: SORTS.find((s) => SORT_SLUGS[s] === initial?.sort) ?? SORTS[0],
    };
  });
  const [dq, setDq] = useState("");
  const [sheet, setSheet] = useState(false);

  // Re-pin the range to the catalogue bounds only when those bounds actually
  // change — not on first mount, which would clobber a URL-seeded range.
  const boundsReady = useRef(false);
  useEffect(() => {
    if (!boundsReady.current) {
      boundsReady.current = true;
      return;
    }
    setF((s) => ({ ...s, range: [priceMin, priceMax] }));
  }, [priceMin, priceMax]);

  // Mirror the active filters into the URL so any filtered view is a shareable,
  // linkable address (multiple brands included). replaceState keeps it purely
  // client-side; the navbar's ?q= search is preserved. The page canonical stays
  // /shop, so these filtered URLs are shareable without becoming indexable
  // duplicates.
  useEffect(() => {
    const params = new URLSearchParams();
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) params.set("q", q);
    f.designers.forEach((d) => params.append("designer", d));
    f.cats.forEach((c) => params.append("category", c));
    f.colors.forEach((c) => params.append("color", c));
    if (f.sale) params.set("sale", "1");
    if (f.range[0] > priceMin) params.set("min", String(f.range[0]));
    if (f.range[1] < priceMax) params.set("max", String(f.range[1]));
    if (SORT_SLUGS[f.sort]) params.set("sort", SORT_SLUGS[f.sort]);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [f, priceMin, priceMax]);

  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const rangeNarrowed = f.range[0] > priceMin || f.range[1] < priceMax;

  const inRange = (p: Product) => {
    const n = priceNum(p);
    return n >= f.range[0] && n <= f.range[1];
  };

  const matches = (p: Product, skip?: Dim | "sale" | "range"): boolean => {
    if (skip !== "sale" && f.sale && !productIsOnSale(p)) return false;
    if (skip !== "range" && !inRange(p)) return false;
    for (const d of ["designers", "cats", "colors"] as Dim[]) {
      if (skip === d || f[d].length === 0) continue;
      if (!f[d].some((v) => hit(p, d, v))) return false;
    }
    return true;
  };

  const list = useMemo(() => {
    const out = products.filter((p) => matches(p));
    if (f.sort === "Price — low to high")
      return [...out].sort((a, b) => priceNum(a) - priceNum(b));
    if (f.sort === "Price — high to low")
      return [...out].sort((a, b) => priceNum(b) - priceNum(a));
    if (f.sort === "Discount — high to low")
      return [...out].sort((a, b) => discountOf(b) - discountOf(a));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, f]);

  // When the shopper has narrowed to exactly one house, surface its editorial
  // header above the grid (the SEO brand page's on-site treatment).
  const brand = f.designers.length === 1 ? f.designers[0]! : null;
  const brandInfo = brand ? BRANDS[brand] : null;
  const brandStats = useMemo(() => {
    if (!brand) return null;
    const items = products.filter((p) => p.vendor === brand);
    const prices = items.map(priceNum);
    return {
      n: items.length,
      from: prices.length ? Math.min(...prices) : 0,
      sale: items.filter(productIsOnSale).length,
    };
  }, [products, brand]);

  const count = (dim: Dim, v: string) =>
    products.filter((p) => matches(p, dim) && hit(p, dim, v)).length;
  const saleCount = products.filter(
    (p) => matches(p, "sale") && productIsOnSale(p),
  ).length;

  const activeN =
    f.cats.length +
    f.designers.length +
    f.colors.length +
    (f.sale ? 1 : 0) +
    (rangeNarrowed ? 1 : 0);
  const dirty = activeN > 0 || f.sort !== SORTS[0];

  const toggle = (dim: Dim, v: string) =>
    setF((s) => ({
      ...s,
      [dim]: s[dim].includes(v)
        ? s[dim].filter((x) => x !== v)
        : [...s[dim], v],
    }));
  const clearDim = (dim: Dim) => setF((s) => ({ ...s, [dim]: [] }));
  const setRange = (a: number, b: number) =>
    setF((s) => ({
      ...s,
      range: [Math.min(a, b - STEP), Math.max(b, a + STEP)],
    }));
  const resetAll = () => {
    setDq("");
    setF({
      cats: [],
      designers: [],
      colors: [],
      range: [priceMin, priceMax],
      sale: false,
      sort: SORTS[0],
    });
  };

  const shownDesigners = facets.designers.filter(
    (d) => !dq.trim() || d.toLowerCase().includes(dq.trim().toLowerCase()),
  );

  const groups = (
    <>
      <div className="rail-g">
        <h4>
          <i>01</i>Status
        </h4>
        <div className="optl">
          <button
            className={`cbx ${f.sale ? "on" : ""}`}
            onClick={() => setF((s) => ({ ...s, sale: !s.sale }))}
          >
            <span className="bx" aria-hidden="true" />
            <span className="lb">Sale only</span>
            <span className="n">{saleCount}</span>
          </button>
        </div>
      </div>

      {facets.categories.length > 0 && (
        <div className="rail-g">
          <h4>
            <i>02</i>Category
            {f.cats.length > 0 && (
              <button className="lnk sm" onClick={() => clearDim("cats")}>
                reset
              </button>
            )}
          </h4>
          <div className="optl">
            {facets.categories.map((c) => {
              const n = count("cats", c);
              return (
                <button
                  key={c}
                  className={`cbx ${f.cats.includes(c) ? "on" : ""} ${n === 0 ? "zero" : ""}`}
                  onClick={() => toggle("cats", c)}
                >
                  <span className="bx" aria-hidden="true" />
                  <span className="lb">{c}</span>
                  <span className="n">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {facets.designers.length > 0 && (
        <div className="rail-g">
          <h4>
            <i>03</i>Designer
            {f.designers.length > 0 && (
              <button className="lnk sm" onClick={() => clearDim("designers")}>
                reset
              </button>
            )}
          </h4>
          <div className={`dsrch ${dq ? "on" : ""}`}>
            <svg
              className="ic"
              viewBox="0 0 14 14"
              width="12"
              height="12"
              aria-hidden="true"
            >
              <circle
                cx="6"
                cy="6"
                r="4.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <line
                x1="9.2"
                y1="9.2"
                x2="12.6"
                y2="12.6"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
            <input
              value={dq}
              onChange={(e) => setDq(e.target.value)}
              placeholder="Search designers"
              aria-label="Search designers"
            />
            {dq && (
              <button
                className="x"
                onClick={() => setDq("")}
                aria-label="Clear"
              >
                ✕
              </button>
            )}
          </div>
          {shownDesigners.length === 0 ? (
            <p className="dsrch-none">No house matches “{dq}”</p>
          ) : (
            <div className="optl">
              {shownDesigners.map((d) => {
                const n = count("designers", d);
                return (
                  <button
                    key={d}
                    className={`cbx ${f.designers.includes(d) ? "on" : ""} ${n === 0 ? "zero" : ""}`}
                    onClick={() => toggle("designers", d)}
                  >
                    <span className="bx" aria-hidden="true" />
                    <span className="lb">{d}</span>
                    <span className="n">{n}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {facets.colors.length > 0 && (
        <div className="rail-g">
          <h4>
            <i>04</i>Colour
            {f.colors.length > 0 && (
              <button className="lnk sm" onClick={() => clearDim("colors")}>
                reset
              </button>
            )}
          </h4>
          <div className="optl optl-sw">
            {facets.colors.map((c) => {
              const n = count("colors", c);
              return (
                <button
                  key={c}
                  className={`cbx sw ${f.colors.includes(c) ? "on" : ""} ${n === 0 ? "zero" : ""}`}
                  onClick={() => toggle("colors", c)}
                >
                  <span
                    className="dot"
                    style={{ background: colorHex(c) }}
                    aria-hidden="true"
                  />
                  <span className="lb">{c}</span>
                  <span className="n">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rail-g">
        <h4>
          <i>05</i>Price
          {rangeNarrowed && (
            <button
              className="lnk sm"
              onClick={() =>
                setF((s) => ({ ...s, range: [priceMin, priceMax] }))
              }
            >
              reset
            </button>
          )}
        </h4>
        <div className="prng">
          <div className="prng-v">
            <span className="rng">
              {f.range[0]} — {f.range[1]}
              {f.range[1] >= priceMax ? "+" : ""} USD
            </span>
            <span className="mid">
              {rangeNarrowed ? `${list.length} in range` : "Any price"}
            </span>
          </div>
          <div className="prng-s">
            <span className="prng-trk" />
            <span
              className="prng-fill"
              style={{
                left: `${((f.range[0] - priceMin) / (priceMax - priceMin || 1)) * 100}%`,
                right: `${100 - ((f.range[1] - priceMin) / (priceMax - priceMin || 1)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={STEP}
              value={f.range[0]}
              aria-label="Minimum price"
              onChange={(e) => setRange(+e.target.value, f.range[1])}
            />
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={STEP}
              value={f.range[1]}
              aria-label="Maximum price"
              onChange={(e) => setRange(f.range[0], +e.target.value)}
            />
          </div>
        </div>
        <div className="pgrp-s">
          <span className="sub">Order</span>
          <div className="optl">
            {SORTS.map((s) => (
              <button
                key={s}
                className={`cbx rad ${f.sort === s ? "on" : ""}`}
                onClick={() => setF((v) => ({ ...v, sort: s }))}
              >
                <span className="bx" aria-hidden="true" />
                <span className="lb">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const grid =
    list.length === 0 ? (
      <div className="sempty">
        <p>No pieces match this combination.</p>
        <button className="btn" onClick={resetAll}>
          Clear all filters →
        </button>
      </div>
    ) : (
      <div className="sgrid">
        {list.map((p, i) => (
          <ShopCard
            key={p.handle}
            product={p}
            index={i}
            brandHref={p.vendor ? brandHrefs?.[p.vendor] : undefined}
          />
        ))}
      </div>
    );

  return (
    <>
      {/* Mobile trigger bar */}
      <div className="msbar">
        <button className="msbtn" onClick={() => setSheet(true)}>
          Filter &amp; sort{activeN > 0 && <i>{activeN}</i>}
        </button>
        <span className="mono agmnt-tnum">{list.length} pieces</span>
      </div>

      <div className="lay-rail">
        <aside className="rail" data-testid="shop-rail">
          <div className="rail-h">
            <span className="mono">Filters</span>
            <span className="rail-n">
              {activeN ? `${activeN} active` : "none active"}
            </span>
            {dirty && (
              <button className="lnk" onClick={resetAll}>
                Clear
              </button>
            )}
          </div>
          {groups}
          <div className="rail-f mono agmnt-tnum">
            {list.length} of {products.length} shown
          </div>
        </aside>

        <div className="lay-main">
          {brand && brandStats && (
            <section className="bnote">
              <div className="bnote-t">
                <h2>
                  {brandHrefs?.[brand] ? (
                    <Link href={brandHrefs[brand]}>{brand}</Link>
                  ) : (
                    brand
                  )}
                </h2>
              </div>
              {brandInfo?.note && <p>{brandInfo.note}</p>}
              <div className="bnote-m mono">
                {brandInfo?.est && (
                  <>
                    <span>Est. {brandInfo.est}</span>
                    <span className="sl">/</span>
                  </>
                )}
                {brandInfo?.city && (
                  <>
                    <span>{brandInfo.city}</span>
                    <span className="sl">/</span>
                  </>
                )}
                <span>
                  {brandStats.n} {brandStats.n === 1 ? "piece" : "pieces"}
                </span>
                <span className="sl">/</span>
                <span>From {brandStats.from} USD</span>
                {brandStats.sale > 0 && (
                  <>
                    <span className="sl">/</span>
                    <button
                      className="bnote-sale"
                      onClick={() => setF((s) => ({ ...s, sale: true }))}
                    >
                      {brandStats.sale} on sale
                    </button>
                  </>
                )}
              </div>
            </section>
          )}
          <div className="ghead">
            <span className="agmnt-tnum">
              {list.length} {list.length === 1 ? "piece" : "pieces"} shown
              {f.sort !== SORTS[0] && ` · ${f.sort}`}
            </span>
          </div>
          {grid}
        </div>
      </div>

      {/* Mobile full-screen sheet */}
      {sheet && (
        <div className="msheet" role="dialog" aria-label="Filter and sort">
          <div className="msheet-h">
            <span>Filter &amp; sort</span>
            <button className="lnk" onClick={() => setSheet(false)}>
              Close ✕
            </button>
          </div>
          <div className="msheet-b">{groups}</div>
          <div className="msheet-f">
            <button className="lnk" onClick={resetAll}>
              Clear all
            </button>
            <button className="btn" onClick={() => setSheet(false)}>
              Show {list.length} pieces
            </button>
          </div>
        </div>
      )}
    </>
  );
}
