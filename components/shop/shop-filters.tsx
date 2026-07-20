"use client";

import { sorting } from "lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type Facets = {
  categories: string[];
  designers: string[];
  colors: string[];
};

/**
 * SS26 shop filter rails. URL-driven so the server keeps doing the actual
 * product filtering (params: type, vendor, color, sort, sale) — this component
 * only reads the active state and navigates. Left rail = Sale / Categories /
 * Designers; right rail = Sort / Colors. On mobile both collapse into a drawer.
 */
export function ShopFilters({
  facets,
  resultCount,
  children,
}: {
  facets: Facets;
  resultCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dq, setDq] = useState("");
  const [drawer, setDrawer] = useState(false);

  const type = searchParams.get("type");
  const vendor = searchParams.get("vendor");
  const color = searchParams.get("color");
  const sort = searchParams.get("sort");
  const sale = searchParams.get("sale") === "1";

  const dirty = Boolean(type || vendor || color || sort || sale);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  // Build a URL that sets/removes one param while preserving the rest.
  const withParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("q");
    if (value === null) p.delete(key);
    else p.set(key, value);
    const qs = p.toString();
    return `/shop${qs ? `?${qs}` : ""}`;
  };

  const go = (key: string, value: string | null) => {
    router.push(withParam(key, value));
    setDrawer(false);
  };

  const toggle = (key: string, current: string | null, value: string) =>
    go(key, current === value ? null : value);

  const shownDesigners = useMemo(
    () =>
      facets.designers.filter(
        (d) => !dq.trim() || d.toLowerCase().includes(dq.trim().toLowerCase()),
      ),
    [facets.designers, dq],
  );

  const reset = () => {
    setDq("");
    router.push("/shop");
    setDrawer(false);
  };

  const Left = (
    <>
      <button
        className={`sale-check ${sale ? "on" : ""}`}
        onClick={() => go("sale", sale ? null : "1")}
      >
        <span className="box" aria-hidden="true" />
        <span className="lab">Sale</span>
      </button>

      <div className="frail-group">
        <h4
          className={`frail-head ${!type ? "sel" : ""}`}
          onClick={() => go("type", null)}
        >
          Categories
        </h4>
        <div className="frail-list">
          {facets.categories.map((c) => (
            <button
              key={c}
              className={`frail-opt up ${type === c ? "sel" : ""}`}
              onClick={() => toggle("type", type, c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="frail-group">
        <h4
          className={`frail-head ${!vendor ? "sel" : ""}`}
          onClick={() => go("vendor", null)}
        >
          Designers
        </h4>
        <input
          className="designer-search"
          placeholder="Search designers"
          value={dq}
          onChange={(e) => setDq(e.target.value)}
        />
        <div className="frail-list">
          {shownDesigners.map((d) => (
            <button
              key={d}
              className={`frail-opt ${vendor === d ? "sel" : ""}`}
              onClick={() => toggle("vendor", vendor, d)}
            >
              {d}
            </button>
          ))}
          {shownDesigners.length === 0 && (
            <span className="frail-none">No houses match</span>
          )}
        </div>
      </div>
    </>
  );

  const Right = (
    <>
      <div className="frail-group">
        <h4>Sort</h4>
        <div className="frail-list">
          {sorting.map((s) => (
            <button
              key={s.title}
              className={`frail-opt ${(!sort && !s.slug) || sort === s.slug ? "sel" : ""}`}
              onClick={() => go("sort", s.slug)}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {facets.colors.length > 0 && (
        <div className="frail-group">
          <h4
            className={`frail-head ${!color ? "sel" : ""}`}
            onClick={() => go("color", null)}
          >
            Colors
          </h4>
          <div className="frail-list">
            {facets.colors.map((c) => (
              <button
                key={c}
                className={`frail-opt ${color === c ? "sel" : ""}`}
                onClick={() => toggle("color", color, c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mfbar">
        <button className="mfbtn" onClick={() => setDrawer(true)}>
          Filter &amp; sort
        </button>
        <span className="mfcount agmnt-tnum">{resultCount} shown</span>
      </div>

      <div className="shop-layout">
        <aside className="frail left" data-testid="shop-rail-left">
          {Left}
        </aside>
        <div className="shop-center">{children}</div>
        <aside className="frail right" data-testid="shop-rail-right">
          {Right}
        </aside>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <>
          <div className="mdrawer-scrim" onClick={() => setDrawer(false)} />
          <div className="mdrawer" role="dialog">
            <div className="mdrawer-head">
              <span>Filter &amp; sort</span>
              <button onClick={() => setDrawer(false)}>Close ✕</button>
            </div>
            <div className="mdrawer-body">
              <div className="frail">{Left}</div>
              <div className="mdrawer-rule" />
              <div className="frail">{Right}</div>
            </div>
            <div className="mdrawer-foot">
              {dirty && <button onClick={reset}>Clear all</button>}
              <button className="apply" onClick={() => setDrawer(false)}>
                Show {resultCount} pieces
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
