"use client";

import CartLink from "components/cart/cart-link";
import { useCart } from "components/cart/cart-context";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Search, { SearchSkeleton } from "./search";

type NavLink = { href: string; label: string; n: string; hidden?: boolean };

// Set `hidden: true` to pull a link from the nav (desktop + mobile) without
// deleting it. The route itself stays live. Editorial is hidden for now —
// remove the flag to bring it back.
const ALL_LINKS: NavLink[] = [
  { href: "/shop", label: "Shop", n: "01" },
  { href: "/installations", label: "Installations", n: "02" },
  { href: "/editorial", label: "Editorial", n: "03", hidden: true },
];

const LINKS = ALL_LINKS.filter((l) => !l.hidden);

/**
 * Navbar — v6 "Left lockup" desktop, and a one-row mobile bar (≤640px):
 * logo · divider · Shop · Installations · Search · Cart. No menu drawer:
 * every destination is one tap away. Each mobile button is a 44×44px
 * minimum target (WCAG 2.5.5 AAA).
 */
// `counts` was used by the old mobile drawer; kept so callers don't break.
export function NavbarContent(_props: { counts?: (number | null)[] }) {
  const pathname = usePathname();
  const { cart } = useCart();
  const count = cart?.totalQuantity || 0;
  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nv nv--v2">
      {/* Desktop */}
      <nav className="nv-desk nv-row" aria-label="Main">
        <Link
          href="/"
          prefetch={true}
          className="nv-logo"
          aria-label="AGMNT home"
        >
          <Image
            src="/images/AGMNT-logo-black.png"
            alt="AGMNT"
            width={132}
            height={65}
            priority
          />
        </Link>
        <span className="nv-div" aria-hidden="true" />
        <div className="nv-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={true}
              aria-current={isCurrent(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nv-util">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
          <CartLink />
        </div>
      </nav>

      {/* Mobile: one row, text buttons, no drawer */}
      <nav className="nv-mob" aria-label="Main">
        <Link
          href="/"
          prefetch={true}
          className="nv-logo nv-mlogo"
          aria-label="AGMNT home"
        >
          <Image
            src="/images/AGMNT-logo-black.png"
            alt="AGMNT"
            width={132}
            height={65}
          />
        </Link>
        <span className="nv-mdiv" aria-hidden="true" />
        <div className="nv-mbtns">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={true}
              className="nv-mbtn"
              aria-current={isCurrent(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <Suspense fallback={<SearchSkeleton triggerClassName="nv-mbtn" />}>
            <Search triggerClassName="nv-mbtn" />
          </Suspense>
          <Link
            href="/cart"
            className="nv-mbtn"
            aria-current={isCurrent("/cart") ? "page" : undefined}
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            Cart <i>({count})</i>
          </Link>
        </div>
      </nav>
    </div>
  );
}
