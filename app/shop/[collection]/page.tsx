import { getCountry } from "lib/localization";
import { ShopBrowser } from "components/shop/shop-browser";
import { getCollection, getCollectionProducts } from "lib/shopify";
import { computeFacets, initialFromParams } from "lib/shop-facets";
import { baseUrl, productPath } from "lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const [collection, products] = await Promise.all([
    getCollection(params.collection),
    getCollectionProducts({ collection: params.collection }),
  ]);

  if (!collection) return notFound();

  // An empty collection (e.g. an archive brand with nothing listed) is a thin
  // page that says "No products found". Keep it out of the index until it has
  // stock; links on it are still followed.
  const empty = products.length === 0;

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description ||
      collection.description ||
      `Shop ${collection.title} at AGMNT. Ships worldwide.`,
    alternates: {
      // Canonical is always the bare collection path, so filtered param
      // variants (?vendor=&color=…) never register as duplicate URLs.
      canonical: `/shop/${params.collection}`,
    },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const sp = (await props.searchParams) ?? {};

  const [collection, products] = await Promise.all([
    getCollection(params.collection),
    getCollectionProducts({
      collection: params.collection,
      country: await getCountry(),
    }),
  ]);

  // Brand landing page = every product shares the collection's own vendor.
  const raw = computeFacets(products);
  const isBrand =
    raw.designers.length === 1 &&
    !!collection &&
    raw.designers[0]?.toLowerCase() === collection.title.toLowerCase();

  const title = collection?.title ?? params.collection;

  // On a brand page the collection's own Shopify description is the house note,
  // so a designer-filtered header shows the same live copy as the main shop.
  const brandNotes: Record<string, string> = {};
  if (isBrand && raw.designers[0] && collection?.description?.trim()) {
    brandNotes[raw.designers[0]] = collection.description.trim();
  }

  const url = `${baseUrl}/shop/${params.collection}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "Shop",
          item: `${baseUrl}/shop`,
        },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
    ...(products.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: collection?.seo?.title || title,
            description: collection?.description || undefined,
            url,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: products.length,
              itemListElement: products.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${baseUrl}${productPath(p)}`,
                name: p.vendor ? `${p.vendor} ${p.title}` : p.title,
              })),
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            : `Shop ${collection.title} at AGMNT. Ships worldwide.`}
        </p>
      )}

      {products.length === 0 ? (
        <div className="sempty">
          <p>No products found in this collection.</p>
          <a href="/shop">Back to shop →</a>
        </div>
      ) : (
        <ShopBrowser
          products={products}
          initial={initialFromParams(sp)}
          brandNotes={brandNotes}
        />
      )}
    </>
  );
}
