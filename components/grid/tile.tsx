"use client";

import clsx from "clsx";
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
    brand?: string;
    position?: "center" | "bottom";
  };
} & React.ComponentProps<typeof Image>) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col w-full">
      {/* Image Container */}
      <div
        className={clsx(
          "relative w-full aspect-[3/4] overflow-hidden bg-white",
          {
            "cursor-pointer": isInteractive,
          }
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {props.src ? (
          <>
            <Image
              className={clsx("w-full h-full object-cover", {
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
                  "absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300",
                  {
                    "opacity-0": !isHovered,
                    "opacity-100": isHovered,
                  }
                )}
              />
            )}
          </>
        ) : null}
      </div>

      {/* Product Info Below Image */}
      {label ? (
        <div className="flex flex-col w-full items-start justify-center mt-4 font-vremena tracking-[-0.04em] text-left">
          {label.brand && (
            <span className="text-xs text-black">{label.brand}</span>
          )}
          <span className="text-sm text-black">{label.title}</span>
          <span className="text-xs text-black">
            {parseFloat(label.amount).toFixed(0)} {label.currencyCode}
          </span>
        </div>
      ) : null}
    </div>
  );
}