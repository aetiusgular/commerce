"use client";

import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCart } from "./cart-context";

/**
 * Navbar cart affordance. Navigates to the /cart page (replacing the old
 * slide-in modal) and shows the live item count from the cart context.
 */
export default function CartLink({ isMobile = false }: { isMobile?: boolean }) {
  const { cart } = useCart();
  const count = cart?.totalQuantity || 0;

  if (isMobile) {
    return (
      <Link
        href="/cart"
        aria-label="Cart"
        className="relative flex items-center justify-center"
      >
        <ShoppingBagIcon className="h-8 w-8" />
        {count > 0 ? (
          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
            {count}
          </div>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      className="whitespace-nowrap transition-opacity hover:opacity-60"
    >
      CART ({count})
    </Link>
  );
}
