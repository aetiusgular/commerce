import type { Product } from "lib/shopify/types";
import { isOnSale } from "lib/utils";

/**
 * Shared facet + filter logic for the shop surfaces. Used by both the top-level
 * `/shop` page and every collection/brand landing page (`/shop/[collection]`)
 * so the three rails, the counts, and the actual filtering stay identical and
 * in sync. All work is done in-process against a product list already fetched
 * from Shopify — no multi-collection GraphQL nesting.
 */

// Categories = Shopify collections (minus system/hidden ones).
export const HIDDEN_COLLECTIONS = ["frontpage", "all"];

export const categoriesOf = (p: Product): string[] =>
  (p.collections ?? [])
    .filter(
      (c) =>
        !HIDDEN_COLLECTIONS.includes(c.handle) &&
        !c.handle.startsWith("hidden"),
    )
    .map((c) => c.title);

// Colors = tags. Either a `color:Grey`-prefixed tag or a plain named colour.
export const KNOWN_COLORS = new Set([
  "black",
  "grey",
  "gray",
  "white",
  "ivory",
  "cream",
  "brown",
  "beige",
  "tan",
  "khaki",
  "olive",
  "stone",
  "sand",
  "charcoal",
  "silver",
  "navy",
  "blue",
  "green",
  "red",
  "burgundy",
  "yellow",
  "orange",
  "pink",
  "purple",
  "ecru",
]);

export const colorOf = (p: Product): string[] => {
  const out: string[] = [];
  for (const tag of p.tags ?? []) {
    if (/^colou?r:/i.test(tag)) out.push(tag.replace(/^colou?r:/i, "").trim());
    else if (KNOWN_COLORS.has(tag.toLowerCase())) out.push(tag);
  }
  return out;
};

export const productIsOnSale = (p: Product): boolean =>
  isOnSale(
    p.compareAtPriceRange?.minVariantPrice,
    p.priceRange.minVariantPrice,
  );

export const priceNum = (p: Product): number =>
  parseFloat(p.priceRange.minVariantPrice.amount);

export type ShopParams = {
  type?: string;
  vendor?: string;
  color?: string;
  sort?: string;
  sale?: string;
  q?: string;
};

/** Distinct, sorted facet values for a set of products. */
export function computeFacets(products: Product[]): {
  categories: string[];
  designers: string[];
  colors: string[];
} {
  // Brand collections (title === a product vendor) and the curatorial Archive
  // collection are real, browsable collections, but they must NOT appear in the
  // Categories rail — categories are garment types / departments only. Brands
  // are reached through the Designers rail instead.
  const excluded = new Set(
    products.map((p) => p.vendor?.toLowerCase()).filter(Boolean),
  );
  excluded.add("archive");

  return {
    categories: [...new Set(products.flatMap(categoriesOf))]
      .filter((c) => !excluded.has(c.toLowerCase()))
      .sort(),
    designers: [
      ...new Set(products.map((p) => p.vendor).filter(Boolean)),
    ].sort(),
    colors: [...new Set(products.flatMap(colorOf))].sort(),
  };
}

/** Apply the active filter/sort params to a product list. */
export function applyShopFilters(
  products: Product[],
  sp: ShopParams,
): Product[] {
  const { type, vendor, color, sort, sale, q } = sp;

  let list = products.filter((p) => {
    if (sale === "1" && !productIsOnSale(p)) return false;
    if (type && !categoriesOf(p).includes(type)) return false;
    if (vendor && p.vendor !== vendor) return false;
    if (color && !colorOf(p).includes(color)) return false;
    if (q) {
      const hay = `${p.vendor} ${p.title}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  if (sort === "price-asc")
    list = [...list].sort((a, b) => priceNum(a) - priceNum(b));
  else if (sort === "price-desc")
    list = [...list].sort((a, b) => priceNum(b) - priceNum(a));
  else if (sort === "latest-desc") list = [...list].reverse();
  // trending / relevance keep Shopify's returned order.

  return list;
}

/** Filter state parsed from the shop URL and handed to the client browser. */
export type InitialShopFilters = {
  designers?: string[];
  cats?: string[];
  colors?: string[];
  sale?: boolean;
  min?: number;
  max?: number;
  sort?: string;
};

const toArr = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v : v ? [v] : [];

/** Parse a Next searchParams object into the shop browser's initial filters. */
export function initialFromParams(sp: {
  [key: string]: string | string[] | undefined;
}): InitialShopFilters {
  return {
    designers: toArr(sp.designer),
    cats: toArr(sp.category),
    colors: toArr(sp.color),
    sale: sp.sale === "1",
    min: typeof sp.min === "string" ? Number(sp.min) : undefined,
    max: typeof sp.max === "string" ? Number(sp.max) : undefined,
    sort: typeof sp.sort === "string" ? sp.sort : undefined,
  };
}
