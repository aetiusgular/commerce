"use client";

import { trackViewContent } from "lib/analytics";
import { useEffect } from "react";

/**
 * Fires a Meta Pixel ViewContent event once per product page view.
 * No-ops when the pixel is not configured.
 */
export function ProductViewTracker({
  id,
  title,
  value,
  currency,
}: {
  id: string;
  title: string;
  value: number;
  currency: string;
}) {
  useEffect(() => {
    trackViewContent({ id, title, value, currency });
  }, [id, title, value, currency]);

  return null;
}
