import { ShopBrowser } from "components/shop/shop-browser";
import { getProducts } from "lib/shopify";
import { applyShopFilters } from "lib/shop-facets";

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
  const sp = (await props.searchParams) as { [key: string]: string };
  const q = sp?.q;

  // Fetch the whole catalogue; the v7 browser filters and sorts client-side so
  // the facet counts, price slider and grid all stay in sync. A navbar search
  // (?q=) pre-narrows the set before the rail's faceting takes over.
  const all = await getProducts({});
  const products = q ? applyShopFilters(all, { q }) : all;

  return <ShopBrowser products={products} />;
}
