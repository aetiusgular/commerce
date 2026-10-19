"use client";

import { DEFAULT_OPTION } from "lib/constants";
import type { Cart, CartItem } from "lib/shopify/types";
import {
  checkoutCostsLabel,
  colorHex,
  isInternational,
  marketNotes,
  productPath,
} from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { redirectToCheckout, removeItem, updateItemQuantity } from "./actions";
import { useCart } from "./cart-context";

// Formats in the cart's own currency (USD, CAD, KRW, ...) so international
// carts never show a "$" in front of a non-dollar amount.
const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(n);

/** One ledger row. Quantity/remove use the same server actions + optimistic
 * cart-context update the modal used, so behaviour is unchanged. */
function CartRow({ item, index }: { item: CartItem; index: number }) {
  const { updateCartItem } = useCart();
  const [, start] = useTransition();

  const product = item.merchandise.product;
  const opts = item.merchandise.selectedOptions.filter(
    (o) => o.value !== DEFAULT_OPTION,
  );
  const color = opts.find((o) => /colou?r/i.test(o.name));
  const size = opts.find((o) => /size/i.test(o.name));

  const params = new URLSearchParams(
    opts.map((o) => [o.name.toLowerCase(), o.value]),
  );
  const href = `${productPath(product)}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const line = parseFloat(item.cost.totalAmount.amount);
  const lineCcy = item.cost.totalAmount.currencyCode;
  const unit = line / item.quantity;
  const lastPair = product.tags?.some((t) => t.toLowerCase() === "last pair");

  const changeQty = (delta: number) => {
    if (item.quantity + delta < 1) return;
    // Optimistic update + server action must be in the SAME transition, or
    // React 19 throws "optimistic state update outside a transition".
    start(() => {
      updateCartItem(item.merchandise.id, delta > 0 ? "plus" : "minus");
      updateItemQuantity(null, {
        merchandiseId: item.merchandise.id,
        quantity: item.quantity + delta,
      });
    });
  };

  const remove = () => {
    start(() => {
      updateCartItem(item.merchandise.id, "delete");
      removeItem(null, item.merchandise.id);
    });
  };

  return (
    <div className="crow">
      <Link className="crow-thumb" href={href}>
        <span className="n">{String(index + 1).padStart(2, "0")}</span>
        {product.featuredImage?.url && (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            fill
            sizes="104px"
          />
        )}
        {lastPair && <span className="tg">Last pair</span>}
      </Link>

      <div className="crow-body">
        {product.vendor && <div className="crow-brand">{product.vendor}</div>}
        <Link className="crow-name" href={href}>
          {product.title}
        </Link>
        {(color || size) && (
          <div className="crow-attrs">
            {color && (
              <span className="attr">
                <span
                  className="sw"
                  style={{ background: colorHex(color.value) }}
                />
                <span className="k">Colour</span> {color.value}
              </span>
            )}
            {size && (
              <span className="attr">
                <span className="k">Size</span> {size.value}
              </span>
            )}
          </div>
        )}
        <div className="crow-acts">
          <button className="rm" onClick={remove}>
            Remove
          </button>
        </div>
      </div>

      <div className="crow-right">
        <div className="crow-price">
          <span className="now tnum">{fmt(line, lineCcy)}</span>
          {item.quantity > 1 && (
            <span className="unit tnum">{fmt(unit, lineCcy)} each</span>
          )}
        </div>
        <div className="step">
          <button
            onClick={() => changeQty(-1)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="v tnum">{item.quantity}</span>
          <button onClick={() => changeQty(1)} aria-label="Increase quantity">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutButton({ total, ccy }: { total: number; ccy: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="checkout" type="submit" disabled={pending}>
      {pending ? (
        "Redirecting…"
      ) : (
        <>
          Proceed to checkout <span className="amt">· {fmt(total, ccy)}</span>
        </>
      )}
    </button>
  );
}

function Summary({ cart, country }: { cart: Cart; country: string }) {
  const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
  const total = parseFloat(cart.cost.totalAmount.amount);
  const ccy = cart.cost.totalAmount.currencyCode;

  return (
    <div className="summary">
      <div className="summary-sticky">
        <h2>Order Summary</h2>

        <div className="srow">
          <span className="k">Subtotal · {cart.totalQuantity} items</span>
          <span className="v tnum">{fmt(subtotal, ccy)}</span>
        </div>
        <div className="srow">
          <span className="k">{checkoutCostsLabel(country)}</span>
          <span className="v free">
            {isInternational(country) ? "Flat rate at checkout" : "Calculated at checkout"}
          </span>
        </div>

        <div className="summary-rule strong" />
        <div className="stotal">
          <span className="k">Total</span>
          <span className="v tnum">
            {fmt(total, ccy)}
            <span className="ccy">{ccy}</span>
          </span>
        </div>
        {country === "US" && (
          <div className="stax">Pay in 4 from {fmt(total / 4, ccy)}</div>
        )}

        <form action={redirectToCheckout}>
          <CheckoutButton total={total} ccy={ccy} />
        </form>
        <div className="pay-note">
          Secure checkout. You won&apos;t be charged until the next step.
        </div>

        <div className="assure">
          {!isInternational(country) && (
            <span>14-day returns on unworn pieces</span>
          )}
          {marketNotes(country).map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <div className="em-mark">Your cart — 00</div>
      <h2>
        Your cart is <em>empty</em>
      </h2>
      <p>Nothing here yet. The new season is waiting.</p>
      <Link className="go" href="/shop">
        Enter the shop →
      </Link>
    </div>
  );
}

export function CartView({ country }: { country: string }) {
  const { cart } = useCart();
  const empty = !cart || cart.lines.length === 0;

  return (
    <>
      {empty ? (
        <Empty />
      ) : (
        <>
          <div className="bag">
            <div className="bag-main">
              <div className="ledger-head">
                <span>Item</span>
                <span>Details</span>
                <span className="r">Line total</span>
              </div>
              {cart.lines.map((item, i) => (
                <CartRow key={item.id ?? i} item={item} index={i} />
              ))}
            </div>
            <Summary cart={cart} country={country} />
          </div>
        </>
      )}
    </>
  );
}
