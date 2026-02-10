"use client";

import { addItem } from "components/cart/actions";
import { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { TbShoppingBagCheck } from "react-icons/tb";
import { useCart } from "./cart-context";

function SubmitButton({
  availableForSale,
  selectedVariantId,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {
  if (!availableForSale) {
    return (
      <div className="w-full border-[0.25px] border-black items-center justify-center gap-x-2 flex flex-row font-mono py-4 bg-gray-100 text-gray-400 cursor-not-allowed">
        <span className="text-xs">OUT OF STOCK</span>
      </div>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        disabled
        className="w-full border-[0.25px] border-black/40 items-center justify-center gap-x-2 flex flex-row font-mono py-4 opacity-60 cursor-not-allowed"
      >
        <TbShoppingBagCheck className="w-4 h-4" />
        <span className="text-xs">SELECT SIZE</span>
      </button>
    );
  }

  return (
    <button
      aria-label="Add to cart"
      className="w-full border-[0.25px] border-black items-center justify-center gap-x-2 flex flex-row font-mono py-4 hover:bg-black hover:text-white transition-colors"
    >
      <TbShoppingBagCheck className="w-4 h-4" />
      <span className="text-xs">ADD TO CART</span>
    </button>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const searchParams = useSearchParams();
  const [message, formAction] = useActionState(addItem, null);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase())
    )
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const addItemAction = formAction.bind(null, selectedVariantId);
  const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  )!;

  return (
    <form
      action={async () => {
        if (finalVariant) {
          addCartItem(finalVariant, product);
        }
        addItemAction();
      }}
    >
      <SubmitButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}