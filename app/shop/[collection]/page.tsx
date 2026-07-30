import { ShopCard } from "components/shop/shop-card";
import { getCollection, getCollectionProducts } from "lib/shopify";
import { defaultSort, sorting } from "lib/constants";
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
      canonical: `/shop/${params.collection}`,
    },
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getCollectionProducts({
    collection: params.collection,
    sortKey,
    reverse,
  });

  const collection = await getCollection(params.collection);

  return (
    <>
      <nav className="shop-crumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <a href="/shop">Shop</a>
        <span className="sep">/</span>
        <span className="here">{collection?.title ?? params.collection}</span>
      </nav>

      <header className="shop-hero">
        <h1>
          Shop{" "}
          <em>— {(collection?.title ?? params.collection).toLowerCase()}</em>
        </h1>
        <div className="hero-meta">
          <span className="big agmnt-tnum">{products.length} pieces</span>
          <span className="mono">SS 2026</span>
        </div>
      </header>

      {collection && (
        <p
          className="shop-crumb"
          style={{ paddingBottom: 12, maxWidth: "70ch" }}
        >
          {collection.description
            ? collection.description
            : `Official stockist of ${collection.title}. In stock and shipped from our Los Angeles studio.`}
        </p>
      )}

      {products.length === 0 ? (
        <div className="slist-empty">
          <p>No products found in this collection.</p>
          <a href="/shop">Back to shop →</a>
        </div>
      ) : (
        <div className="slist">
          {products.map((p, i) => (
            <ShopCard key={p.handle} product={p} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
