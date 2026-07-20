import { ReadonlyURLSearchParams } from "next/navigation";
import type { Money } from "lib/shopify/types";

export const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

/* ------------------------------------------------------------------ *
 * Sale pricing
 *
 * Shopify returns a `compareAtPrice` / `compareAtPriceRange` of "0.0"
 * (not null) when nothing is on sale, so every check must compare the
 * numbers rather than test for presence.
 * ------------------------------------------------------------------ */

/** True when `compareAt` represents a real markdown against `price`. */
export const isOnSale = (
  compareAt: Money | null | undefined,
  price: Money | null | undefined,
): boolean => {
  const was = parseFloat(compareAt?.amount ?? "0");
  const now = parseFloat(price?.amount ?? "0");
  return was > 0 && now > 0 && was > now;
};

/** Whole-number percentage off, e.g. 30 for a 420 → 294 markdown. */
export const discountPercent = (
  compareAt: Money | null | undefined,
  price: Money | null | undefined,
): number => {
  if (!isOnSale(compareAt, price)) return 0;
  const was = parseFloat(compareAt!.amount);
  const now = parseFloat(price!.amount);
  return Math.round(((was - now) / was) * 100);
};

/** Currency formatting used across cards and the PDP. */
export const formatMoney = (money: Money, fractionDigits = 0): string =>
  `${parseFloat(money.amount).toFixed(fractionDigits)} ${money.currencyCode}`;

/**
 * Parses a label→value metafield (Measurements, Details, Materials). Accepts a
 * JSON object `{"Chest":"56 cm"}` or plain text with one `Label: value` per
 * line. Returns null when there's nothing renderable.
 */
export const parseKeyValues = (
  raw: string | null | undefined,
): { label: string; value: string }[] | null => {
  const text = raw?.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const rows = Object.entries(parsed)
        .filter(([, v]) => v !== null && v !== "")
        .map(([label, v]) => ({ label, value: String(v) }));
      if (rows.length) return rows;
    }
  } catch {
    // not JSON — fall through
  }

  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      return i === -1
        ? { label: line, value: "" }
        : { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
    })
    .filter((r) => r.label);

  return rows.length ? rows : null;
};

/** Maps common colour names to a swatch hex. Falls back to a neutral gray. */
export const colorHex = (name: string): string => {
  const map: Record<string, string> = {
    black: "#0a0a0a",
    charcoal: "#3a3a3c",
    grey: "#8a8a85",
    gray: "#8a8a85",
    white: "#f4f4f2",
    ivory: "#efece1",
    cream: "#f0ead9",
    ecru: "#d9d2bf",
    stone: "#c9c3b6",
    sand: "#d7ccb4",
    beige: "#d8cfbb",
    tan: "#c8a97e",
    khaki: "#a39770",
    olive: "#6b6a4b",
    brown: "#6b4f3a",
    navy: "#2b3140",
    ink: "#2b3140",
    blue: "#3a5a8c",
    green: "#4a6b45",
    red: "#8f2f22",
    burgundy: "#5a2230",
    silver: "#c4c4c0",
    pink: "#d4a0a8",
    purple: "#5a4a6b",
    orange: "#c26a2f",
    yellow: "#d8b64a",
  };
  const key = name.trim().toLowerCase();
  return map[key] ?? map[key.split(" ")[0] ?? ""] ?? "#b8b6b0";
};

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`;

export const validateEnvironmentVariables = () => {
  const requiredEnvironmentVariables = [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  ];
  const missingEnvironmentVariables = [] as string[];

  requiredEnvironmentVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingEnvironmentVariables.push(envVar);
    }
  });

  if (missingEnvironmentVariables.length) {
    throw new Error(
      `The following environment variables are missing. Your site will not work without them. Read more: https://vercel.com/docs/integrations/shopify#configure-environment-variables\n\n${missingEnvironmentVariables.join(
        "\n",
      )}\n`,
    );
  }

  if (
    process.env.SHOPIFY_STORE_DOMAIN?.includes("[") ||
    process.env.SHOPIFY_STORE_DOMAIN?.includes("]")
  ) {
    throw new Error(
      "Your `SHOPIFY_STORE_DOMAIN` environment variable includes brackets (ie. `[` and / or `]`). Your site will not work with them there. Please remove them.",
    );
  }
};
