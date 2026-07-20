import { ShopCard } from "components/shop/shop-card";
import { ShopFilters, type Facets } from "components/shop/shop-filters";
import { getProducts } from "lib/shopify";
import type { Product } from "lib/shopify/types";
import { isOnSale } from "lib/utils";

export const metadata = {
  title: "Shop",
  description: "Shop for products in the store.",
};

// Categories = Shopify collections (minus system/hidden ones).
const HIDDEN_COLLECTIONS = ["frontpage", "all"];
const categoriesOf = (p: Product): string[] =>
  (p.collections ?? [])
    .filter(
      (c) =>
        !HIDDEN_COLLECTIONS.includes(c.handle) &&
        !c.handle.startsWith("hidden"),
    )
    .map((c) => c.title);

// Colors = tags. Either a "color:Grey" prefixed tag or a plain named color.
const KNOWN_COLORS = new Set([
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
const colorOf = (p: Product): string[] => {
  const out: string[] = [];
  for (const tag of p.tags ?? []) {
    if (/^colou?r:/i.test(tag)) out.push(tag.replace(/^colou?r:/i, "").trim());
    else if (KNOWN_COLORS.has(tag.toLowerCase())) out.push(tag);
  }
  return out;
};

const productIsOnSale = (p: Product) =>
  isOnSale(
    p.compareAtPriceRange?.minVariantPrice,
    p.priceRange.minVariantPrice,
  );

const priceNum = (p: Product) =>
  parseFloat(p.priceRange.minVariantPrice.amount);

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = (await props.searchParams) as { [key: string]: string };
  const { type, vendor, color, sort, sale, q } = sp;

  // Fetch everything once; derive facets and filter/sort in-process so the
  // three rails stay in sync and the counts are exact.
  const all = await getProducts({});

  const facets: Facets = {
    categories: [...new Set(all.flatMap(categoriesOf))].sort(),
    designers: [...new Set(all.map((p) => p.vendor).filter(Boolean))].sort(),
    colors: [...new Set(all.flatMap(colorOf))].sort(),
  };

  let list = all.filter((p) => {
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

  const dirty = Boolean(type || vendor || color || sort || sale || q);

  return (
    <>
      <ShopFilters facets={facets} resultCount={list.length}>
        <div className="slist-head">
          <span className="agmnt-tnum">
            {list.length} {list.length === 1 ? "piece" : "pieces"} shown
          </span>
          {dirty && <a href="/shop">Clear all ✕</a>}
        </div>

        {list.length > 0 ? (
          <div className="slist">
            {list.map((p, i) => (
              <ShopCard key={p.handle} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="slist-empty">
            <p>No pieces match your filters.</p>
            <a href="/shop">Clear all filters →</a>
          </div>
        )}
      </ShopFilters>
    </>
  );
}
