"use client";

import clsx from "clsx";
import type { Money } from "lib/shopify/types";
import { discountPercent, formatMoney, isOnSale } from "lib/utils";
import Image from "next/image";
import { useState } from "react";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  hoverImage,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  hoverImage?: string;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    /** Shopify compare-at price. Only rendered when it actually beats `amount`. */
    compareAtAmount?: string;
    brand?: string;
    position?: "center" | "bottom";
  };
} & React.ComponentProps<typeof Image>) {
  const [isHovered, setIsHovered] = useState(false);

  const price: Money | undefined = label
    ? { amount: label.amount, currencyCode: label.currencyCode }
    : undefined;
  const compareAt: Money | null =
    label && label.compareAtAmount
      ? { amount: label.compareAtAmount, currencyCode: label.currencyCode }
      : null;

  const onSale = isOnSale(compareAt, price);
  const percentOff = discountPercent(compareAt, price);

  return (
    <div className="flex w-full flex-col">
      {/* Image Container */}
      <div
        className={clsx(
          "relative aspect-[3/4] w-full overflow-hidden bg-white",
          {
            "cursor-pointer": isInteractive,
          },
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {props.src ? (
          <>
            <Image
              className={clsx("h-full w-full object-cover", {
                "opacity-0": isHovered && hoverImage,
                "transition-opacity duration-300": hoverImage,
              })}
              {...props}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={`${props.alt} - alternate view`}
                fill
                className={clsx(
                  "absolute top-0 left-0 h-full w-full object-cover transition-opacity duration-300",
                  {
                    "opacity-0": !isHovered,
                    "opacity-100": isHovered,
                  },
                )}
              />
            )}
            {onSale && (
              <span
                data-testid="sale-tag"
                className="font-vremena absolute top-2 left-2 z-10 bg-red-600 px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-white uppercase"
              >
                Sale
              </span>
            )}
          </>
        ) : null}
      </div>

      {/* Product Info Below Image */}
      {label && price ? (
        <div className="font-vremena mt-4 flex w-full flex-col items-start justify-center text-left tracking-[-0.04em]">
          {label.brand && (
            <span className="text-xs text-black">{label.brand}</span>
          )}
          <span className="text-sm text-black">{label.title}</span>

          {onSale && compareAt ? (
            <span className="flex items-baseline gap-x-1.5 text-xs">
              <span className="text-black/40 line-through">
                {formatMoney(compareAt)}
              </span>
              <span className="text-red-600">{formatMoney(price)}</span>
              <span className="text-[10px] text-red-600">−{percentOff}%</span>
            </span>
          ) : (
            <span className="text-xs text-black">{formatMoney(price)}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
