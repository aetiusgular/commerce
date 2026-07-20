"use client";

import Image from "next/image";

/**
 * Product image gallery.
 *
 * Mobile (< lg): images stack and scroll with the PAGE. There is deliberately
 * no fixed height and no `overflow-y-auto` at this breakpoint — a nested scroll
 * container captures the touch gesture and makes the description / Add to Cart
 * below effectively unreachable.
 *
 * Desktop (>= lg): restores the original two-column behaviour, where the
 * gallery is its own independently scrolling column beside the product info.
 */
export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  return (
    <div
      data-testid="product-gallery"
      className="h-auto overflow-visible lg:h-[95%] lg:overflow-y-auto"
    >
      <div className="flex flex-col gap-4 p-4">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image.src}
            alt={image.altText}
            width={512}
            height={683}
            className="h-auto w-full"
            priority={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
