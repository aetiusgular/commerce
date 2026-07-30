import { ProductViewTracker } from "components/analytics/product-view-tracker";
import Footer from "components/layout/footer";
import { ProductGallery } from "components/product/product-gallery";
import { ProductPanel } from "components/product/product-panel";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from "lib/shopify";
import { baseUrl, productPath, slugify } from "lib/utils";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ brand: string; handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  // Title matches how buyers search ("<designer> <product>"); the layout
  // template appends " | AGMNT". Description states the true selling point.
  const brandTitle = product.vendor
    ? `${product.vendor} ${product.title}`
    : product.title;

  return {
    title: product.seo.title || brandTitle,
    description:
      product.seo.description ||
      product.description ||
      `${product.title}${product.vendor ? ` by ${product.vendor}` : ""} — in stock at AGMNT. Ships from Los Angeles.`,
    alternates: {
      // Always the branded path, so the canonical never depends on which
      // brand segment the visitor arrived through.
      canonical: productPath(product),
    },
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
  params: Promise<{ brand: string; handle: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  // Enforce the canonical brand segment. If someone lands on the wrong or a
  // legacy brand slug, 308 them to the correct /product/<brand>/<handle> so we
  // never serve the same product under two URLs.
  const canonicalBrand = product.vendor ? slugify(product.vendor) : "";
  if (canonicalBrand && params.brand !== canonicalBrand) {
    permanentRedirect(productPath(product));
  }

  const canonicalUrl = `${baseUrl}${productPath(product)}`;
  const availability = product.availableForSale
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const currency = product.priceRange.minVariantPrice.currencyCode;
  const low = product.priceRange.minVariantPrice.amount;
  const high = product.priceRange.maxVariantPrice.amount;
  // Price valid roughly a year out (Google recommends a priceValidUntil).
  const priceValidUntil = new Date(Date.now() + 365 * 864e5)
    .toISOString()
    .slice(0, 10);

  const commonOffer = {
    priceCurrency: currency,
    availability,
    itemCondition: "https://schema.org/NewCondition",
    url: canonicalUrl,
    priceValidUntil,
    seller: { "@type": "Organization", name: "AGMNT" },
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images?.length
      ? product.images.map((img) => img.url)
      : product.featuredImage?.url,
    ...(product.vendor
      ? { brand: { "@type": "Brand", name: product.vendor } }
      : {}),
    offers:
      low === high
        ? { "@type": "Offer", price: low, ...commonOffer }
        : {
            "@type": "AggregateOffer",
            lowPrice: low,
            highPrice: high,
            offerCount: product.variants?.length || 1,
            ...commonOffer,
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
            fallbackAlt={
              product.vendor
                ? `${product.vendor} ${product.title}`
                : product.title
            }
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
          <a key={p.handle} href={productPath(p)} className="pdp-rec">
            <div className="pdp-rec-img">
              {p.featuredImage?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.featuredImage.url}
                  alt={
                    p.featuredImage.altText ||
                    (p.vendor ? `${p.vendor} ${p.title}` : p.title)
                  }
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
