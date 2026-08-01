import { ShopBrowser } from "components/shop/shop-browser";
import { getCollection, getCollectionProducts } from "lib/shopify";
import { computeFacets } from "lib/shop-facets";
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
}) {
  const params = await props.params;

  const [collection, products] = await Promise.all([
    getCollection(params.collection),
    getCollectionProducts({ collection: params.collection }),
  ]);

  // Brand landing page = every product shares the collection's own vendor.
  const raw = computeFacets(products);
  const isBrand =
    raw.designers.length === 1 &&
    !!collection &&
    raw.designers[0]?.toLowerCase() === collection.title.toLowerCase();

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
        <div className="sempty">
          <p>No products found in this collection.</p>
          <a href="/shop">Back to shop →</a>
        </div>
      ) : (
        <ShopBrowser products={products} />
      )}
    </>
  );
}
