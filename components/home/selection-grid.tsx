"use client";

import type { Product } from "lib/shopify/types";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { SelectionCard } from "./selection-card";

type Cat = { handle: string; title: string; path: string };

/**
 * 02 / Shop — sidebar + product grid. The category rail is height-matched to
 * the product-card row next to it: a ResizeObserver measures the grid, and the
 * rail is sized so it ends exactly at the grid's bottom edge, with its rows
 * growing to fill (never running past the cards, never falling short). Only
 * applied in the desktop single-row layout (>1024px); below that the rail
 * reflows on its own.
 */
export function SelectionGrid({
  categories,
  products,
}: {
  categories: Cat[];
  products: Product[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const catsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    const cats = catsRef.current;
    if (!grid || !cats) return;

    const apply = () => {
      const desktop = window.matchMedia("(min-width: 1025px)").matches;
      if (desktop) {
        // Fill from the rail's own top down to the grid's bottom edge.
        const h = Math.round(
          grid.getBoundingClientRect().bottom -
            cats.getBoundingClientRect().top,
        );
        cats.style.height = h > 0 ? `${h}px` : "";
        cats.dataset.fill = h > 0 ? "1" : "";
      } else {
        cats.style.height = "";
        cats.dataset.fill = "";
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(grid);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [products.length, categories.length]);

  return (
    <section className="sel">
      <div className="sel-l">
        <h3>
          This weeks <em>selection</em>
        </h3>
        <div className="curated">Curated by the AGMNT buying desk</div>
        <div className="cats" ref={catsRef}>
          {categories.map((c) => (
            <Link key={c.handle} href={c.path}>
              {c.title}
              <span className="ar">→</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="pgrid" ref={gridRef}>
        {products.map((p, i) => (
          <SelectionCard key={p.handle} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
