import { ShopCard } from "components/shop/shop-card";
import { ShopFilters, type Facets } from "components/shop/shop-filters";
import { getCollection, getCollectionProducts } from "lib/shopify";
import { applyShopFilters, computeFacets } from "lib/shop-facets";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `Shop ${collection.title} in stock at AGMNT — official stockist, ships from Los Angeles.`,
    alternates: {
      // Canonical is always the bare collection path, so filtered param
      // variants (?vendor=&color=…) never register as duplicate URLs.
      canonical: `/shop/${params.collection}`,
    },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const sp = ((await props.searchParams) ?? {}) as { [key: string]: string };
  const { type, vendor, color, sort, sale, q } = sp;

  const [collection, products] = await Promise.all([
    getCollection(params.collection),
    getCollectionProducts({ collection: params.collection }),
  ]);

  // Facets scoped to this collection's products. A rail with a single value is
  // dropped (empty array hides it) so a brand page doesn't show a one-item
  // "Designers" rail, nor a single-category page a one-item "Categories" rail.
  const raw = computeFacets(products);
  const facets: Facets = {
    categories: raw.categories.length > 1 ? raw.categories : [],
    designers: raw.designers.length > 1 ? raw.designers : [],
    colors: raw.colors,
  };

  // Brand landing page = every product shares the collection's own vendor.
  const isBrand =
    raw.designers.length === 1 &&
    !!collection &&
    raw.designers[0]?.toLowerCase() === collection.title.toLowerCase();

  const list = applyShopFilters(products, {
    type,
    vendor,
    color,
    sort,
    sale,
    q,
  });
  const dirty = Boolean(type || vendor || color || sort || sale || q);
  const base = `/shop/${params.collection}`;
  const title = collection?.title ?? params.collection;

  return (
    <>
      <nav className="shop-crumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <a href="/shop">Shop</a>
        <span className="sep">/</span>
        <span className="here">{title}</span>
      </nav>

      <header className="shop-hero">
        <h1>
          Shop <em>— {title.toLowerCase()}</em>
        </h1>
      </header>

      {collection && (
        <p
          className="shop-crumb"
          style={{ paddingBottom: 12, maxWidth: "70ch" }}
        >
          {collection.description
            ? collection.description
            : isBrand
              ? `Official stockist of ${collection.title}. In stock and shipped from our Los Angeles studio.`
              : `Shop ${collection.title} in stock at AGMNT — official stockist, shipped from Los Angeles.`}
        </p>
      )}

      {products.length === 0 ? (
        <div className="slist-empty">
          <p>No products found in this collection.</p>
          <a href="/shop">Back to shop →</a>
        </div>
      ) : (
        <ShopFilters facets={facets} resultCount={list.length} basePath={base}>
          <div className="slist-head">
            <span className="agmnt-tnum">
              {list.length} {list.length === 1 ? "piece" : "pieces"} shown
            </span>
            {dirty && <a href={base}>Clear all ✕</a>}
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
              <a href={base}>Clear all filters →</a>
            </div>
          )}
        </ShopFilters>
      )}
    </>
  );
}
