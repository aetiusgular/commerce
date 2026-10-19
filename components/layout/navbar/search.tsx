"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Command } from "cmdk";
import { categoriesOf, computeFacets } from "lib/shop-facets";
import { indexProducts, searchProducts } from "lib/search";
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

export default function Search({
  isMobile = false,
  triggerClassName,
}: {
  isMobile?: boolean;
  /** Overrides the trigger's classes (the mobile bar uses its own button style). */
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  // cmdk keeps the last item selected after the pointer leaves it. Only show
  // that selection while the user is navigating with the arrow keys; with a
  // mouse, rows underline on hover alone.
  const [keyboardNav, setKeyboardNav] = useState(false);
  // The filter remount replaces the rail buttons; put focus back on the one
  // that was pressed so keyboard users keep their place.
  const refocusRail = useRef<string | null>(null);
  useEffect(() => {
    const label = refocusRail.current;
    if (!label) return;
    refocusRail.current = null;
    dialogRef.current
      ?.querySelector<HTMLElement>(`[data-rail="${CSS.escape(label)}"]`)
      ?.focus();
  }, [filter]);
  // True only for the first render after opening; filter remounts skip it.
  const focusInputOnMount = useRef(true);
  useEffect(() => {
    focusInputOnMount.current = !isOpen;
  }, [isOpen]);
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

  // Brand, title, type, category, colour, options, tags and description.
  const index = useMemo(() => indexProducts(products ?? []), [products]);

  const { results, widened } = useMemo(() => {
    let list = index;
    if (filter.kind === "designer")
      list = list.filter((ip) => ip.product.vendor === filter.value);
    if (filter.kind === "category")
      list = list.filter((ip) =>
        categoriesOf(ip.product).includes(filter.value),
      );
    const r = searchProducts(list, query);
    // Nothing inside the selected brand or category: search everything
    // rather than show an empty page ("veerkracht" while on Xlim).
    if (!r.products.length && query.trim() && filter.kind !== "all") {
      const all = searchProducts(index, query);
      if (all.products.length)
        return {
          results: all.products,
          widened: true,
        };
    }
    return { results: r.products, widened: false };
  }, [index, filter, query]);

  const scope =
    filter.kind === "all" || widened ? "All products" : filter.value;
  const q = query.trim();
  // Always echo exactly what was typed; misspellings still return the
  // closest pieces underneath.
  const heading = q ? `“${q}” in ${scope}` : scope;

  const railItem = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      data-rail={label}
      aria-pressed={active}
      onClick={() => {
        refocusRail.current = label;
        onClick();
      }}
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
          // Remount on filter change: cmdk otherwise keeps
          // aria-activedescendant pointing at a row that was removed.
          key={filter.kind === "all" ? "all" : `${filter.kind}:${filter.value}`}
          shouldFilter={false}
          loop
          onKeyDown={(e) => {
            if (["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key))
              setKeyboardNav(true);
            // Enter without arrowing to a row opens the full results page,
            // the same matching (typos included) with filters and the grid.
            if (e.key === "Enter" && !keyboardNav && query.trim()) {
              e.preventDefault();
              const params = new URLSearchParams({ q: query.trim() });
              if (filter.kind === "designer")
                params.set("designer", filter.value);
              if (filter.kind === "category")
                params.set("category", filter.value);
              setIsOpen(false);
              router.push(`/shop?${params}`);
            }
          }}
          label="Search products"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="search-head">
            <Command.Input
              placeholder="Search brands, pieces, colours"
              className="search-input"
              // Focus the field when search opens, not after a filter
              // remount, so tapping a brand never pops the phone keyboard.
              autoFocus={focusInputOnMount.current}
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
              {products && !results.length && (
                <p className="search-empty">
                  No pieces match. Try a brand, colour or garment type.
                </p>
              )}
              <Command.List
                className={`search-list ${keyboardNav ? "is-keyboard" : ""}`}
                onMouseMove={() => keyboardNav && setKeyboardNav(false)}
                // An empty listbox fails ARIA's required-children rule.
                hidden={!results.length}
              >
                {results.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={p.id}
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
      className={triggerClassName ?? "transition-opacity hover:opacity-60"}
    >
      {triggerClassName ? "Search" : "SEARCH"}
    </button>
  );
}

export function SearchSkeleton({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  return (
    <button
      type="button"
      className={triggerClassName ?? "transition-opacity hover:opacity-60"}
    >
      {triggerClassName ? "Search" : "SEARCH"}
    </button>
  );
}
