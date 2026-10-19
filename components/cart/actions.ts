"use server";

import { TAGS } from "lib/constants";
import { COUNTRY_COOKIE, getCountry } from "lib/localization";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
  updateCartCountry,
} from "lib/shopify";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined,
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  try {
    // A first-time visitor (e.g. a fresh phone) has no cartId cookie yet — the
    // old cart modal used to create one via createCartAndSetCookie on mount,
    // but it's no longer rendered. Create the cart lazily on the first add so
    // add-to-cart works on any device, not just ones with a pre-existing cart.
    if (!(await cookies()).get("cartId")?.value) {
      const cart = await createCart();
      const jar = await cookies();
      jar.set("cartId", cart.id!);
      // Pin the pricing country to the cart so cart, checkout and product
      // pages all agree even if the geo-IP lookup changes mid-session.
      if (!jar.get(COUNTRY_COOKIE)?.value) {
        jar.set(COUNTRY_COOKIE, await getCountry(), {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
      }
    }
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    updateTag(TAGS.cart);
  } catch (e) {
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      updateTag(TAGS.cart);
    } else {
      return "Item not found in cart";
    }
  } catch (e) {
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  },
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    updateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function redirectToCheckout() {
  // Carts made before localized pricing shipped have no buyer country. Set it
  // so checkout opens in the same currency the site showed.
  try {
    await updateCartCountry(await getCountry());
  } catch {}
  let cart = await getCart();

  if (!cart?.checkoutUrl) return;

  redirect(cart.checkoutUrl);
}

export async function createCartAndSetCookie() {
  let cart = await createCart();
  (await cookies()).set("cartId", cart.id!);
}
