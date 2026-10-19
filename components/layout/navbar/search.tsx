"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Command } from "cmdk";
import { categoriesOf, computeFacets } from "lib/shop-facets";
import type { Product } from "lib/shopify/types";
import { productPath } from "lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./search.css";

type Filter =
  | { kind: "all" }
  | { kind: "designer"; value: string }
  | { kind: "category"; value: string };

const formatPrice = (amount: string, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(parseFloat(amount));

/** Every word in the query must appear in the title, brand, type or a category. */
const matches = (p: Product, q: string) => {
  const hay = [p.title, p.vendor, p.productType, ...categoriesOf(p)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

export default function Search({ isMobile = false }: { isMobile?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // The trigger unmounts while the overlay is open, so focus is restored
  // after the next commit, once the button exists again.
  const restoreFocus = useRef(false);
  const close = useCallback(() => {
    restoreFocus.current = true;
    setIsOpen(false);
  }, []);
  useEffect(() => {
    if (!isOpen && restoreFocus.current) {
      restoreFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Load once per open. The API prices products for the visitor's country.
  useEffect(() => {
    if (!isOpen || products) return;
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setError(true));
  }, [isOpen, products]);

  // Escape closes; lock page scroll while the overlay is up.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      // Keep Tab inside the dialog (aria-modal does not trap focus itself).
      if (e.key !== "Tab" || !dialogRef.current) return;
      const els = dialogRef.current.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      const first = els[0];
      const last = els[els.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  // Only designers and categories that have live products. Archive brands
  // whose products are unpublished never appear.
  const facets = useMemo(() => {
    const f = computeFacets(products ?? []);
    const byName = (a: string, b: string) =>
      a.localeCompare(b, "en", { sensitivity: "base" });
    return {
      designers: [...f.designers].sort(byName),
      categories: [...f.categories].sort(byName),
    };
  }, [products]);

  const results = useMemo(() => {
    let list = products ?? [];
    if (filter.kind === "designer")
      list = list.filter((p) => p.vendor === filter.value);
    if (filter.kind === "category")
      list = list.filter((p) => categoriesOf(p).includes(filter.value));
    if (query.trim()) list = list.filter((p) => matches(p, query.trim()));
    return list;
  }, [products, filter, query]);

  const heading =
    (query.trim() ? `“${query.trim()}” in ` : "") +
    (filter.kind === "all" ? "All products" : filter.value);

  const railItem = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`search-rail-item ${active ? "is-active" : ""}`}
    >
      {label}
    </button>
  );

  if (isOpen) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search the shop"
        className="search-overlay fixed inset-0 z-50 flex flex-col bg-white text-black font-vremena"
      >
        <Command
          shouldFilter={false}
          loop
          label="Search products"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="search-head">
            <Command.Input
              placeholder="Search products or brands"
              className="search-input"
              autoFocus
              value={query}
              onValueChange={setQuery}
            />
            <button
              type="button"
              onClick={close}
              className="search-close"
              aria-label="Close search"
            >
              <span className="search-esc" aria-hidden="true">
                ESC
              </span>
              <Cross1Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="search-body">
            <nav className="search-rail" aria-label="Filter search">
              {facets.designers.length > 0 && (
                <div
                  className="search-rail-group"
                  role="group"
                  aria-labelledby="sr-designers"
                >
                  <span id="sr-designers" className="search-rail-label">
                    Designers
                  </span>
                  {facets.designers.map((d) =>
                    railItem(
                      d,
                      filter.kind === "designer" && filter.value === d,
                      () =>
                        setFilter(
                          filter.kind === "designer" && filter.value === d
                            ? { kind: "all" }
                            : { kind: "designer", value: d },
                        ),
                    ),
                  )}
                </div>
              )}
              {facets.categories.length > 0 && (
                <div
                  className="search-rail-group"
                  role="group"
                  aria-labelledby="sr-categories"
                >
                  <span id="sr-categories" className="search-rail-label">
                    Categories
                  </span>
                  {facets.categories.map((c) =>
                    railItem(
                      c,
                      filter.kind === "category" && filter.value === c,
                      () =>
                        setFilter(
                          filter.kind === "category" && filter.value === c
                            ? { kind: "all" }
                            : { kind: "category", value: c },
                        ),
                    ),
                  )}
                </div>
              )}
            </nav>

            <div
              className="search-results"
              tabIndex={0}
              role="region"
              aria-label="Search results"
            >
              <p className="search-count" aria-live="polite">
                {products
                  ? `${heading} · ${results.length}`
                  : error
                    ? "Search is unavailable right now. Please refresh and try again."
                    : "Loading…"}
              </p>
              <Command.List className="search-list">
                {products && (
                  <Command.Empty className="search-empty">
                    No pieces match. Try a brand name or a garment type.
                  </Command.Empty>
                )}
                {results.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={p.id}
                    keywords={[p.vendor, p.productType].filter(Boolean)}
                    onSelect={() => {
                      setIsOpen(false);
                      router.push(productPath(p));
                    }}
                    className="search-row"
                  >
                    <span className="search-row-name">{p.title}</span>
                    <span className="search-row-leader" aria-hidden="true" />
                    <span className="search-row-price">
                      {formatPrice(
                        p.priceRange.minVariantPrice.amount,
                        p.priceRange.minVariantPrice.currencyCode,
                      )}
                    </span>
                  </Command.Item>
                ))}
              </Command.List>
            </div>
          </div>
        </Command>
      </div>
    );
  }

  if (isMobile) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center"
        aria-label="Open search"
        aria-haspopup="dialog"
      >
        <MagnifyingGlassIcon className="h-8 w-8" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setIsOpen(true)}
      aria-haspopup="dialog"
      className="transition-opacity hover:opacity-60"
    >
      SEARCH
    </button>
  );
}

export function SearchSkeleton() {
  return (
    <button type="button" className="transition-opacity hover:opacity-60">
      SEARCH
    </button>
  );
}
