"use client";

import type { SaleBanner as SaleBannerData } from "lib/shopify";
import Link from "next/link";
import { useState } from "react";

/**
 * Thin site-wide sale bar, mounted above the navbar.
 *
 * Dismissal is intentionally in-memory only (component state) — it clears on
 * reload rather than persisting, so a returning visitor still sees the sale.
 */
export function SaleBanner({ banner }: { banner: SaleBannerData | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (!banner || dismissed) return null;

  const content = (
    <span className="font-vremena text-[11px] tracking-[0.14em] uppercase">
      {banner.text}
    </span>
  );

  return (
    <div
      data-testid="sale-banner"
      className="relative flex w-full items-center justify-center bg-black px-10 py-2 text-white"
    >
      {banner.link ? (
        <Link href={banner.link} className="hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}

      <button
        type="button"
        aria-label="Dismiss sale banner"
        onClick={() => setDismissed(true)}
        className="absolute right-3 flex h-6 w-6 items-center justify-center text-white/60 transition-colors hover:text-white"
      >
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          aria-hidden="true"
        >
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      </button>
    </div>
  );
}
