/**
 * Meta (Facebook / Instagram) Pixel helpers.
 *
 * Every call is a no-op unless the pixel actually loaded, so the site behaves
 * identically in local dev and preview builds where NEXT_PUBLIC_META_PIXEL_ID
 * is not set. Never throws.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export const isPixelEnabled = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.fbq === "function" &&
  Boolean(META_PIXEL_ID);

/** Low-level passthrough to fbq('track', ...). Safe to call anywhere. */
export function track(event: string, payload?: Record<string, unknown>): void {
  if (!isPixelEnabled()) return;
  try {
    window.fbq!("track", event, payload);
  } catch {
    // Analytics must never break a purchase flow.
  }
}

export function trackPageView(): void {
  track("PageView");
}

export function trackViewContent(params: {
  id: string;
  title: string;
  value: number;
  currency: string;
}): void {
  track("ViewContent", {
    content_ids: [params.id],
    content_name: params.title,
    content_type: "product",
    value: params.value,
    currency: params.currency,
  });
}

export function trackAddToCart(params: {
  id: string;
  title: string;
  value: number;
  currency: string;
}): void {
  track("AddToCart", {
    content_ids: [params.id],
    content_name: params.title,
    content_type: "product",
    value: params.value,
    currency: params.currency,
  });
}
