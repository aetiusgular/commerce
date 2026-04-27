"use client";

import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";
import CartModal from "components/cart/modal";
import { Menu } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import { useNavbarStyles } from "./navbar-styles";
import Search, { SearchSkeleton } from "./search";

const ACCOUNT_URL = "https://shop.agmnt.space/account";

export function NavbarContent({ menu }: { menu: Menu[] }) {
  const styles = useNavbarStyles();

  return (
    <>
      {/* Mobile Navbar */}
      <nav className={styles.mobile}>
        {/* Left - Logo */}
        <div className="flex items-center py-2">
          <Link href="/" prefetch={true} className="flex items-center">
            <Image
              src="/images/AGMNT-logo-black.png"
              alt="AGMNT"
              width={130.5}
              height={64.5}
            />
          </Link>
        </div>

        {/* Right - Icons */}
        <div className="flex items-center justify-end gap-6 py-2">
          {/* Search Icon - Opens Search Modal */}
          <Suspense fallback={<MagnifyingGlassIcon className="w-8 h-8" />}>
            <Search isMobile />
          </Suspense>

          {/* Account Icon - Links to Shopify-hosted customer account */}
          <a
            href={ACCOUNT_URL}
            aria-label="Account"
            className="flex items-center justify-center"
          >
            <UserIcon className="w-8 h-8" />
          </a>

          {/* Cart Icon - Opens Cart Modal */}
          <CartModal isMobile />

          {/* Plus Icon - Opens Menu */}
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
      </nav>

      {/* Desktop Navbar */}
      <nav className={styles.desktop}>
        {/* Left - SHOP + INSTALLATIONS */}
        <div className="flex items-center gap-6">
          <Link href="/shop" prefetch={true} className="hover:underline">
            SHOP
          </Link>
          <Link href="/installations" prefetch={true} className="hover:underline">
            INSTALLATIONS
          </Link>
        </div>

        {/* Center - Logo */}
        <div className="flex items-center justify-center">
          <Link href="/" prefetch={true}>
            <Image
              src="/images/AGMNT-logo-black.png"
              alt="AGMNT"
              width={118.5}
              height={58.5}
            />
          </Link>
        </div>

        {/* Right - Search, Account & Cart */}
        <div className="flex items-center justify-end gap-6 [&>button]:text-sm [&>button]:hover:underline">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
          <a href={ACCOUNT_URL} className="text-sm hover:underline">
            ACCOUNT
          </a>
          <CartModal />
        </div>
      </nav>
    </>
  );
}