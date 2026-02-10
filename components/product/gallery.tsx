"use client";

import Image from "next/image";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  return (
    <div className="h-[95%] overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image.src}
            alt={image.altText}
            width={512}
            height={683}
            className="w-full h-auto"
            priority={index === 0}
          />
        ))}
      </div>
    </div>
  );
}