import type { Product } from "lib/shopify/types";
import { discountPercent, formatMoney, isOnSale, productPath } from "lib/utils";
import Image from "next/image";
import Link from "next/link";

/**
 * Shop grid card — v7 `.pc`: image (3/4) with a hover second-image crossfade and
 * a NEW / LAST PAIR corner tag, then brand (+ "· N% off" on sale), the product
 * name, and a price row (struck original + now) with a "View more" link to the
 * PDP. Scoped under `.agmnt-shop` so it doesn't collide with the home `.pc`.
 */
export function ShopCard({
  product,
  brandHref,
}: {
  product: Product;
  index?: number;
  brandHref?: string;
}) {
  const href = productPath(product);

  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice ?? null;
  const onSale = isOnSale(compareAt, price);
  const off = discountPercent(compareAt, price);

  const tags = product.tags ?? [];
  const tag = tags.some((t) => t.toLowerCase() === "last pair")
    ? "Last pair"
    : tags.some((t) => t.toLowerCase() === "new")
      ? "New"
      : null;

  // Second product image, revealed on hover (CSS-only crossfade).
  const hoverImage = product.images?.find(
    (img) => img.url !== product.featuredImage?.url,
  );

  return (
    <article className="pc">
      <Link href={href} className="pc-img" aria-label={product.title}>
        {tag && <span className="pc-tag">{tag}</span>}
        {product.featuredImage?.url && (
          <Image
            className="pc-base"
            src={product.featuredImage.url}
            alt={
              product.featuredImage.altText ||
              (product.vendor
                ? `${product.vendor} ${product.title}`
                : product.title)
            }
            fill
            sizes="(min-width: 1180px) 22vw, (min-width: 820px) 30vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        )}
        {hoverImage?.url && (
          <Image
            className="pc-hover"
            src={hoverImage.url}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1180px) 22vw, (min-width: 820px) 30vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </Link>

      <div className="pc-meta">
        {product.vendor &&
          (brandHref ? (
            <Link className="pc-brand" href={brandHref}>
              {product.vendor}
            </Link>
          ) : (
            <span className="pc-brand">{product.vendor}</span>
          ))}
        {onSale && off > 0 && <span className="off"> · {off}% off</span>}
      </div>

      <Link href={href} className="pc-name">
        <b>{product.title}</b>
      </Link>

      <div className="pc-foot">
        <span className="pc-price agmnt-tnum">
          {onSale && compareAt && (
            <s>{Math.round(parseFloat(compareAt.amount))}</s>
          )}
          {formatMoney(price)}
        </span>
        <Link
          href={href}
          className="pc-add"
          aria-label={`View ${product.title}`}
        >
          View more
        </Link>
      </div>
    </article>
  );
}
