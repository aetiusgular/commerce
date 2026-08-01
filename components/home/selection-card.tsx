import type { Product } from "lib/shopify/types";
import { formatMoney, productPath } from "lib/utils";
import Image from "next/image";
import Link from "next/link";

/**
 * 02 / Shop selection card — v6 `.pc`: image, "NN / Colour" meta,
 * "Brand — Name", and a price + "View more" row. Every card routes to the
 * product page (where colour/size are chosen), so the CTA is uniform.
 */
export function SelectionCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const href = productPath(product);
  const colour = product.tags?.[0] || "—";
  const price = formatMoney(product.priceRange.minVariantPrice);
  // Second image for the hover crossfade (first shot that isn't the cover).
  const hoverImage = product.images?.find(
    (img) => img.url !== product.featuredImage?.url,
  );

  return (
    <article className="pc">
      <Link className="pc-img" href={href} aria-label={product.title}>
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
            sizes="(min-width: 1024px) 23vw, 50vw"
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
            sizes="(min-width: 1024px) 23vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </Link>
      <div className="pc-meta">
        {String(index + 1).padStart(2, "0")} / {colour}
      </div>
      <Link className="pc-name" href={href}>
        <b>{product.vendor}</b> <span>— {product.title}</span>
      </Link>
      <div className="pc-foot">
        <span className="pc-price">{price}</span>
        <Link
          className="pc-add"
          href={href}
          aria-label={`View ${product.title}`}
        >
          View more
        </Link>
      </div>
    </article>
  );
}
