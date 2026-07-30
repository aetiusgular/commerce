import type { Product } from "lib/shopify/types";
import { formatMoney, isOnSale, productPath } from "lib/utils";
import Image from "next/image";
import Link from "next/link";

/**
 * Shop grid card (SS26 reference): large borderless image with a hover
 * second-image crossfade and an "Add to bag" overlay, then brand over product
 * name and the price (muted; sale shows a struck original + red price).
 */
export function ShopCard({ product }: { product: Product; index?: number }) {
  const href = productPath(product);

  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice ?? null;
  const onSale = isOnSale(compareAt, price);
  const isNew = product.tags?.some((t) => t.toLowerCase() === "new");

  // Second product image, revealed on hover (CSS-only fade, no JS).
  const hoverImage = product.images?.find(
    (img) => img.url !== product.featuredImage?.url,
  );

  return (
    <article className="scard">
      <Link href={href} className="scard-img" aria-label={product.title}>
        {onSale ? (
          <span className="tag sale">Sale</span>
        ) : isNew ? (
          <span className="tag new">New</span>
        ) : null}
        {product.featuredImage?.url ? (
          <Image
            className="scard-base"
            src={product.featuredImage.url}
            alt={
              product.featuredImage.altText ||
              (product.vendor
                ? `${product.vendor} ${product.title}`
                : product.title)
            }
            fill
            sizes="(min-width: 900px) 30vw, 50vw"
          />
        ) : null}
        {hoverImage?.url && (
          <Image
            className="scard-hover"
            src={hoverImage.url}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 900px) 30vw, 50vw"
          />
        )}
      </Link>

      <Link href={href} className="scard-name">
        {product.vendor && (
          <span className="scard-brand">{product.vendor}</span>
        )}
        <span className="scard-title">{product.title}</span>
      </Link>

      {onSale && compareAt ? (
        <div className="scard-price sale agmnt-tnum">
          <span className="was">{formatMoney(compareAt)}</span>
          <span className="now">{formatMoney(price)}</span>
        </div>
      ) : (
        <div className="scard-price agmnt-tnum">{formatMoney(price)}</div>
      )}
    </article>
  );
}
