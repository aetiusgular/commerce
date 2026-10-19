import { getCountry } from "lib/localization";
import { ShopBrowser } from "components/shop/shop-browser";
import { getCollections, getProducts } from "lib/shopify";
import { computeFacets, initialFromParams } from "lib/shop-facets";
import { indexProducts, searchProducts } from "lib/search";
import { slugify } from "lib/utils";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return {
    title: "Shop",
    description: "Shop for products in the store.",
    alternates: { canonical: "/shop" },
    // Search result pages are thin duplicates of /shop; keep them out of the
    // index but let crawlers follow the product links.
    ...(typeof sp.q === "string" && sp.q.trim()
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = ((await props.searchParams) ?? {}) as {
    [key: string]: string | string[] | undefined;
  };
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;

  // Fetch the whole catalogue; the v7 browser filters and sorts client-side so
  // the facet counts, price slider and grid all stay in sync. A navbar search
  // (?q=) pre-narrows the set before the rail's faceting takes over, and the
  // remaining params seed the rail so a shared link restores its filters.
  const [all, collections] = await Promise.all([
    getProducts({ country: await getCountry() }),
    getCollections(),
  ]);
  // Same matching as the search overlay: brand, title, type, category,
  // colour, options, tags and description, ranked, with typo correction.
  const found = q ? searchProducts(indexProducts(all), q) : null;
  const products = found ? found.products : all;

  // Map each designer to its brand collection: the href powers the crawlable
  // internal link on cards + header, and the description (edited in Shopify, not
  // hardcoded) is the house note shown under the brand name in the rail header.
  const brandHrefs: Record<string, string> = {};
  const brandNotes: Record<string, string> = {};
  for (const v of computeFacets(all).designers) {
    const vslug = slugify(v);
    const match = collections.find(
      (c) => c.handle === vslug || slugify(c.title) === vslug,
    );
    if (match?.handle) brandHrefs[v] = `/shop/${match.handle}`;
    if (match?.description?.trim()) brandNotes[v] = match.description.trim();
  }

  return (
    <ShopBrowser
      // A new search starts from a clean rail.
      key={q ?? ""}
      products={products}
      search={q ? { q, correctedTo: found?.correctedTo ?? null } : undefined}
      initial={initialFromParams(sp)}
      brandHrefs={brandHrefs}
      brandNotes={brandNotes}
    />
  );
}
