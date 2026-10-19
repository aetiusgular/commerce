"use server";

import { TAGS } from "lib/constants";
import { COUNTRY_COOKIE, normalizeCountry } from "lib/localization";
import { updateCartCountry } from "lib/shopify";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

export async function setCountry(code: string) {
  const country = normalizeCountry(code);
  (await cookies()).set(COUNTRY_COOKIE, country, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  try {
    await updateCartCountry(country);
  } catch {
    // A stale or completed cart just gets recreated on the next add.
  }
  updateTag(TAGS.cart);
}
