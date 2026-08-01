import type { Product } from "lib/shopify/types";
import { productPath } from "lib/utils";
import Image from "next/image";
import Link from "next/link";

const TAG_LABELS: { match: string; label: string; emphasized: boolean }[] = [
  { match: "new", label: "NEW", emphasized: true },
  { match: "last", label: "LAST PAIR", emphasized: false },
  { match: "limited", label: "LIMITED", emphasized: false },
];

function deriveTag(
  tags: string[],
): { label: string; emphasized: boolean } | null {
  for (const t of tags) {
    const lower = t.toLowerCase();
    const found = TAG_LABELS.find((x) => lower.includes(x.match));
    if (found) return { label: found.label, emphasized: found.emphasized };
  }
  return null;
}

export function ShopCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const tag = deriveTag(product.tags);
  const colorOption = product.options.find(
    (o) => o.name.toLowerCase() === "color",
  );
  const colorCount = colorOption?.values.length ?? 0;
  const productType = product.tags[0] || "Piece";
  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(
    0,
  );
  const currency = product.priceRange.minVariantPrice.currencyCode;

  return (
    <article className="flex flex-col">
      <Link href={productPath(product)} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          {tag && (
            <span
              className={`absolute top-2 left-2 z-10 px-2 py-0.5 font-vremena text-[10px] tracking-[-0.02em] uppercase ${
                tag.emphasized
                  ? "bg-black text-white"
                  : "bg-white text-black border border-black"
              }`}
            >
              {tag.label}
            </span>
          )}
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 50vw"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200" />
          )}
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between font-vremena text-[10px] uppercase tracking-[-0.02em] text-black/40">
        <span>
          {String(index + 1).padStart(2, "0")} / {productType}
        </span>
        {colorCount > 0 && (
          <span>
            {colorCount} color{colorCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <Link
        href={productPath(product)}
        className="mt-1 font-vremena text-sm tracking-[-0.04em] line-clamp-3 h-[60px] lg:line-clamp-2 lg:h-10 overflow-hidden"
      >
        {product.vendor && <span>{product.vendor} </span>}
        <em className="not-italic text-black/60">— {product.title}</em>
      </Link>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="font-vremena text-sm tracking-[-0.04em]">
          {price} {currency}
        </div>
        <Link
          href={productPath(product)}
          className="font-vremena text-[11px] tracking-[-0.02em] uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
        >
          Add to cart
        </Link>
      </div>
    </article>
  );
}
