"use client";

import { ProductOption, ProductVariant } from "lib/shopify/types";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

export function VariantSelector({
  options,
  variants,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSize, setSelectedSize] = React.useState<string>("");

  const hasNoOptionsOrJustOneOption =
    !options.length ||
    (options.length === 1 && options[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({
        ...accumulator,
        [option.name.toLowerCase()]: option.value,
      }),
      {}
    ),
  }));

  const updateOption = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Find the size option
  const sizeOption = options.find((opt) => opt.name.toLowerCase() === "size");

  if (!sizeOption) {
    return null;
  }

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setSelectedSize(size);
    updateOption("size", size);
  };

  return (
    <select
      value={selectedSize || searchParams.get("size") || ""}
      onChange={handleSizeChange}
      className={`w-full h-10 px-2 border-[0.25px] border-black bg-white appearance-none font-mono cursor-pointer uppercase text-xs text-left pt-0.5 ${
        selectedSize || searchParams.get("size") ? "opacity-100" : "opacity-60"
      }`}
    >
      <option value="" disabled>
        SELECT A SIZE
      </option>
      {sizeOption.values.map((size) => (
        <option key={size} value={size} className="uppercase">
          {size}
        </option>
      ))}
    </select>
  );
}