import { ProductViewTracker } from "components/analytics/product-view-tracker";
import Footer from "components/layout/footer";
import { ProductGallery } from "components/product/product-gallery";
import { ProductPanel } from "components/product/product-panel";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from "lib/shopify";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.featuredImage.url,
    offers: {
      "@type": "AggregateOffer",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <ProductViewTracker
        id={product.id}
        title={product.title}
        value={parseFloat(product.priceRange.minVariantPrice.amount)}
        currency={product.priceRange.minVariantPrice.currencyCode}
      />
      <div className="agmnt-pdp flex min-h-screen w-full flex-col">
        <nav className="pdp-crumb">
          <a href="/shop">Shop</a>
          {product.productType && (
            <>
              <span className="sep">/</span>
              <span>{product.productType}</span>
            </>
          )}
          <span className="sep">/</span>
          <span className="here">{product.title}</span>
        </nav>

        <div className="pdp2">
          <ProductGallery
            images={product.images.map((image) => ({
              url: image.url,
              altText: image.altText,
            }))}
            lastPair={product.tags?.some(
              (t) => t.toLowerCase() === "last pair",
            )}
          />
          <ProductPanel product={product} />
        </div>

        <Suspense fallback={null}>
          <RelatedProducts id={product.id} />
        </Suspense>

        <Footer />
      </div>
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const related = await getProductRecommendations(id);
  if (!related.length) return null;

  return (
    <section className="pdp-recs">
      <div className="pdp-recs-head">
        <a href="/shop">All of the shop →</a>
      </div>
      <div className="pdp-recs-grid">
        {related.slice(0, 4).map((p, i) => (
          <a key={p.handle} href={`/product/${p.handle}`} className="pdp-rec">
            <div className="pdp-rec-img">
              {p.featuredImage?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.featuredImage.url}
                  alt={p.featuredImage.altText || p.title}
                />
              )}
            </div>
            <div className="pdp-rec-meta">
              {String(i + 1).padStart(2, "0")}
              {p.productType ? ` / ${p.productType}` : ""}
            </div>
            <div className="pdp-rec-name">
              {p.vendor} <em>— {p.title}</em>
            </div>
            <div className="pdp-rec-price agmnt-tnum">
              {parseFloat(p.priceRange.minVariantPrice.amount).toFixed(0)}{" "}
              {p.priceRange.minVariantPrice.currencyCode}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
