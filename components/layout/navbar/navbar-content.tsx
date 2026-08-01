"use client";

import CartLink from "components/cart/cart-link";
import { useCart } from "components/cart/cart-context";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Search, { SearchSkeleton } from "./search";

const LINKS = [
  { href: "/shop", label: "Shop", n: "01" },
  { href: "/installations", label: "Installations", n: "02" },
  { href: "/editorial", label: "Editorial", n: "03" },
];

/**
 * Navbar — v6 "Left lockup" desktop + the mobile kit (≤900px): a 52px bar
 * (burger · logo · Cart) with a full-sheet drawer portalled to <body>. The
 * drawer top follows the live nav's bottom edge via --nv-top.
 */
export function NavbarContent({ counts }: { counts?: (number | null)[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { cart } = useCart();
  const count = cart?.totalQuantity || 0;

  useEffect(() => setMounted(true), []);

  // Publish the nav's bottom edge so the drawer (on <body>) starts below it.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty(
        "--nv-top",
        `${Math.max(0, Math.round(el.getBoundingClientRect().bottom))}px`,
      );
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set);
    window.addEventListener("scroll", set, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
      window.removeEventListener("scroll", set);
    };
  }, []);

  // Open behaviours: lock scroll, Escape closes, auto-close past 900px.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    close();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  const drawer = (
    <div
      className={`nv-drawer ${open ? "open" : ""}`}
      id="nv-drawer"
      aria-hidden={!open}
    >
      <div className="nv-drawer-in">
        <form className="nv-search" onSubmit={onSearch}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="5.6"
              cy="5.6"
              r="4.6"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M9.1 9.1L12.4 12.4"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          <input
            type="search"
            name="q"
            placeholder="Search AGMNT"
            aria-label="Search"
          />
        </form>
        <nav className="nv-mlinks">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              tabIndex={open ? 0 : -1}
              style={{ transitionDelay: open ? `${80 + i * 55}ms` : "0ms" }}
            >
              <i>{l.n}</i>
              {l.label}
              {counts?.[i] != null && (
                <em>{String(counts[i]).padStart(2, "0")}</em>
              )}
            </Link>
          ))}
        </nav>
        <div className="nv-mfoot">
          <span className="wk">Week 31 · Fall / Winter 2025</span>
          <div className="nv-msocial">
            <a
              href="https://www.instagram.com/agmnt_store/"
              onClick={close}
              tabIndex={open ? 0 : -1}
            >
              Instagram
            </a>
            <Link href="/#newsletter" onClick={close} tabIndex={open ? 0 : -1}>
              Newsletter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="nv nv--v2" ref={navRef}>
      {/* Desktop */}
      <nav className="nv-desk nv-row">
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
            <Link key={l.href} href={l.href} prefetch={true}>
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

      {/* Mobile bar */}
      <div className="nv-mob">
        <button
          className="nv-tap"
          aria-label={open ? "Close menu" : "Menu"}
          aria-expanded={open}
          aria-controls="nv-drawer"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`nv-burger ${open ? "x" : ""}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
        <Link
          href="/"
          prefetch={true}
          className="nv-logo"
          aria-label="AGMNT home"
          onClick={close}
        >
          <Image
            src="/images/AGMNT-logo-black.png"
            alt="AGMNT"
            width={132}
            height={65}
          />
        </Link>
        <Link
          href="/cart"
          className={`nv-mcart ${count ? "has" : ""}`}
          aria-label={`Cart, ${count} items`}
        >
          Cart <i>({count})</i>
        </Link>
      </div>

      {/* Full-sheet drawer, portalled to <body> */}
      {mounted && createPortal(drawer, document.body)}
    </div>
  );
}
