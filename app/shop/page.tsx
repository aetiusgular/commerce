import { ShopCard } from "components/shop/shop-card";
import { ShopFilters, type Facets } from "components/shop/shop-filters";
import { getCollections, getProducts } from "lib/shopify";
import { applyShopFilters, computeFacets } from "lib/shop-facets";
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
  const sp = (await props.searchParams) as { [key: string]: string };
  const { type, vendor, color, sort, sale, q } = sp;

  // Fetch everything once; derive facets and filter/sort in-process so the
  // three rails stay in sync and the counts are exact.
  const [all, collections] = await Promise.all([
    getProducts({}),
    getCollections(),
  ]);

  const facets: Facets = computeFacets(all);

  // Map each designer to its dedicated brand collection page when one exists
  // (an automated collection with condition Vendor = <brand>). Matched by
  // slug, so it works whether the handle equals the vendor slug or the
  // collection title equals the vendor name. Designers with no brand collection
  // yet fall back to in-page ?vendor= filtering inside ShopFilters.
  const brandHrefs: Record<string, string> = {};
  for (const v of facets.designers) {
    const vslug = slugify(v);
    const match = collections.find(
      (c) => c.handle === vslug || slugify(c.title) === vslug,
    );
    if (match?.handle) brandHrefs[v] = `/shop/${match.handle}`;
  }

  const list = applyShopFilters(all, { type, vendor, color, sort, sale, q });
  const dirty = Boolean(type || vendor || color || sort || sale || q);

  return (
    <>
      <ShopFilters
        facets={facets}
        resultCount={list.length}
        brandHrefs={brandHrefs}
      >
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
