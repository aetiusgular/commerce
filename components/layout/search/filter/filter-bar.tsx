"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { sorting } from "lib/constants";
import { createUrl } from "lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type FilterSection = {
  title: string;
  items: Array<{ title: string; path: string }>;
};

/**
 * Compact horizontal filter bar for desktop.
 *
 * Replaces the old 200px vertical sidebar so the product grid can use the full
 * page width. Each section collapses into a dropdown pill; the mobile dropdown
 * (filter/dropdown.tsx) is untouched and still handles small screens.
 */
export default function FilterBar({
  sections,
  resultCount,
}: {
  sections: FilterSection[];
  resultCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSection(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const activeSort = searchParams.get("sort");
  const hasActiveFilters =
    Boolean(searchParams.get("vendor")) ||
    Boolean(searchParams.get("color")) ||
    Boolean(activeSort) ||
    pathname !== "/shop";

  const go = (path: string) => {
    router.push(path);
    setOpenSection(null);
  };

  /** The label shown on a pill: the active value if one is selected. */
  const activeLabelFor = (section: FilterSection): string | null => {
    const key =
      section.title.toLowerCase() === "brands"
        ? "vendor"
        : section.title.toLowerCase() === "colors"
          ? "color"
          : null;

    if (key) return searchParams.get(key);

    // Categories are path-based rather than query-based.
    if (section.title.toLowerCase() === "categories") {
      const match = section.items.find(
        (item) => item.path === pathname && pathname !== "/shop",
      );
      return match?.title ?? null;
    }
    return null;
  };

  const pill = (
    label: string,
    isOpen: boolean,
    isActive: boolean,
    onClick: () => void,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "font-vremena flex items-center gap-x-1.5 border px-3 py-1.5 text-xs tracking-[-0.02em] whitespace-nowrap transition-colors",
        isActive
          ? "border-black bg-black text-white"
          : "border-black/30 text-black hover:border-black",
      )}
    >
      {label}
      <ChevronDownIcon
        className={clsx("h-3 w-3 transition-transform", {
          "rotate-180": isOpen,
        })}
      />
    </button>
  );

  const panel = (children: React.ReactNode) => (
    <div className="absolute top-full left-0 z-40 mt-1 max-h-[60vh] min-w-[180px] overflow-y-auto border border-black/20 bg-white">
      <ul className="flex flex-col py-1">{children}</ul>
    </div>
  );

  return (
    <div
      ref={ref}
      data-testid="desktop-filter-bar"
      className="mb-6 hidden items-center gap-2 md:flex"
    >
      {sections.map((section) => {
        const isOpen = openSection === section.title;
        const active = activeLabelFor(section);

        return (
          <div key={section.title} className="relative">
            {pill(active ?? section.title, isOpen, Boolean(active), () =>
              setOpenSection(isOpen ? null : section.title),
            )}
            {isOpen &&
              panel(
                section.items.map((item) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => go(item.path)}
                      className="font-vremena w-full px-3 py-1.5 text-left text-xs whitespace-nowrap hover:bg-black hover:text-white"
                    >
                      {item.title}
                    </button>
                  </li>
                )),
              )}
          </div>
        );
      })}

      {/* Sort */}
      <div className="relative">
        {pill(
          sorting.find((s) => s.slug === activeSort)?.title ?? "Sort",
          openSection === "__sort",
          Boolean(activeSort),
          () => setOpenSection(openSection === "__sort" ? null : "__sort"),
        )}
        {openSection === "__sort" &&
          panel(
            sorting.map((item) => {
              const params = new URLSearchParams(searchParams.toString());
              if (item.slug) params.set("sort", item.slug);
              else params.delete("sort");
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => go(createUrl(pathname, params))}
                    className="font-vremena w-full px-3 py-1.5 text-left text-xs whitespace-nowrap hover:bg-black hover:text-white"
                  >
                    {item.title}
                  </button>
                </li>
              );
            }),
          )}
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => go("/shop")}
          className="font-vremena px-2 py-1.5 text-xs text-black/50 underline-offset-4 hover:text-black hover:underline"
        >
          Reset
        </button>
      )}

      {typeof resultCount === "number" && (
        <span className="font-vremena ml-auto text-xs text-black/40">
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </span>
      )}
    </div>
  );
}
