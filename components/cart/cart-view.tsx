"use client";

import { DEFAULT_OPTION } from "lib/constants";
import type { Cart, CartItem } from "lib/shopify/types";
import { colorHex } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { redirectToCheckout, removeItem, updateItemQuantity } from "./actions";
import { useCart } from "./cart-context";

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const href = `/product/${product.handle}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const line = parseFloat(item.cost.totalAmount.amount);
  const unit = line / item.quantity;
  const lastPair = product.tags?.some((t) => t.toLowerCase() === "last pair");

  const changeQty = (delta: number) => {
    if (item.quantity + delta < 1) return;
    updateCartItem(item.merchandise.id, delta > 0 ? "plus" : "minus");
    start(() => {
      updateItemQuantity(null, {
        merchandiseId: item.merchandise.id,
        quantity: item.quantity + delta,
      });
    });
  };

  const remove = () => {
    updateCartItem(item.merchandise.id, "delete");
    start(() => {
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
          <span className="now tnum">${fmt(line)}</span>
          {item.quantity > 1 && (
            <span className="unit tnum">${fmt(unit)} each</span>
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

function CheckoutButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button className="checkout" type="submit" disabled={pending}>
      {pending ? (
        "Redirecting…"
      ) : (
        <>
          Proceed to checkout <span className="amt">· ${fmt(total)}</span>
        </>
      )}
    </button>
  );
}

function Summary({ cart }: { cart: Cart }) {
  const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
  const total = parseFloat(cart.cost.totalAmount.amount);
  const ccy = cart.cost.totalAmount.currencyCode;

  return (
    <div className="summary">
      <div className="summary-sticky">
        <h2>Order Summary</h2>

        <div className="srow">
          <span className="k">Subtotal · {cart.totalQuantity} items</span>
          <span className="v tnum">${fmt(subtotal)}</span>
        </div>
        <div className="srow">
          <span className="k">Shipping &amp; tax</span>
          <span className="v free">Calculated at checkout</span>
        </div>

        <div className="summary-rule strong" />
        <div className="stotal">
          <span className="k">Total</span>
          <span className="v tnum">
            ${fmt(total)}
            <span className="ccy">{ccy}</span>
          </span>
        </div>
        <div className="stax">Pay in 4 from ${fmt(total / 4)}</div>

        <form action={redirectToCheckout}>
          <CheckoutButton total={total} />
        </form>
        <div className="pay-note">
          Secure checkout — you won&apos;t be charged until the next step
        </div>

        <div className="assure">
          <span>30-day returns on unworn pieces</span>
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <div className="em-mark">Your bag — 00</div>
      <h2>
        Your bag is <em>empty</em>
      </h2>
      <p>Nothing here yet. The new season is waiting.</p>
      <Link className="go" href="/shop">
        Enter the shop →
      </Link>
    </div>
  );
}

export function CartView() {
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
            <Summary cart={cart} />
          </div>
        </>
      )}
    </>
  );
}
