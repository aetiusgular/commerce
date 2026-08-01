import { ShopBrowser } from "components/shop/shop-browser";
import { getCollections, getProducts } from "lib/shopify";
import {
  applyShopFilters,
  computeFacets,
  initialFromParams,
} from "lib/shop-facets";
import { slugify } from "lib/utils";

export const metadata = {
  title: "Shop",
  description: "Shop for products in the store.",
  alternates: {
    canonical: "/shop",
  },
};

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = ((await props.searchParams) ?? {}) as {
    [key: string]: string | string[] | undefined;
  };
  const q = typeof sp.q === "string" ? sp.q : undefined;

  // Fetch the whole catalogue; the v7 browser filters and sorts client-side so
  // the facet counts, price slider and grid all stay in sync. A navbar search
  // (?q=) pre-narrows the set before the rail's faceting takes over, and the
  // remaining params seed the rail so a shared link restores its filters.
  const [all, collections] = await Promise.all([
    getProducts({}),
    getCollections(),
  ]);
  const products = q ? applyShopFilters(all, { q }) : all;

  // Map each designer to its brand collection page (an automated Vendor=X
  // collection), matched by slug. This turns the brand name on every card and
  // the house header into a crawlable internal link to the SEO brand page.
  const brandHrefs: Record<string, string> = {};
  for (const v of computeFacets(all).designers) {
    const vslug = slugify(v);
    const match = collections.find(
      (c) => c.handle === vslug || slugify(c.title) === vslug,
    );
    if (match?.handle) brandHrefs[v] = `/shop/${match.handle}`;
  }

  return (
    <ShopBrowser
      products={products}
      initial={initialFromParams(sp)}
      brandHrefs={brandHrefs}
    />
  );
}
