import { AddToCart } from "components/cart/add-to-cart";
import { Product } from "lib/shopify/types";
import { discountPercent, isOnSale } from "lib/utils";
import { Cookie } from "./cookie";
import { Division } from "./division";
import { Measurements } from "./measurements";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  const colorOption = product.options.find(
    (opt) => opt.name.toLowerCase() === "color",
  );
  const colorValues = colorOption?.values.join(" / ") || "";

  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice ?? null;
  const onSale = isOnSale(compareAt, price);
  const percentOff = discountPercent(compareAt, price);

  return (
    <div className="flex flex-col gap-y-8 tracking-tight [&>h1]:font-vremena [&>span]:font-vremena">
      {/* Product Section */}
      <div className="flex flex-col">
        <Cookie index={1} text="Product" />
        {product.vendor && <span className="pdp-brand">{product.vendor}</span>}
        <h1 className="text-2xl tracking-tight">{product.title}</h1>
        {colorValues && <span className="text-xs">Colour — {colorValues}</span>}

        <Division height="4" />

        <div className="flex flex-col">
          {onSale && compareAt ? (
            <span
              data-testid="pdp-price"
              className="font-vremena -mb-0.5 flex items-baseline gap-x-2 text-xs"
            >
              <span className="text-black/40 line-through">
                {parseFloat(compareAt.amount).toFixed(2)}
              </span>
              <span className="text-red-600">
                {parseFloat(price.amount).toFixed(2)} {price.currencyCode}
              </span>
              <span className="text-[10px] text-red-600">−{percentOff}%</span>
            </span>
          ) : (
            <span
              data-testid="pdp-price"
              className="font-vremena -mb-0.5 text-xs"
            >
              {parseFloat(price.amount).toFixed(2)} {price.currencyCode}
            </span>
          )}
          <span className="font-vremena text-xs opacity-40">
            Taxes and duties included
          </span>
        </div>

        <Division height="4" />

        <VariantSelector
          options={product.options}
          variants={product.variants}
        />

        <Division height="4" />

        <AddToCart product={product} />
      </div>

      {/* Description Section */}
      <div className="flex flex-col">
        <Cookie index={2} text="Description" />
        <div className="flex max-w-prose flex-col gap-y-1 pb-2 text-justify">
          {product.descriptionHtml ? (
            <div
              className="font-vremena w-full pt-1 text-sm leading-relaxed break-words [&>li]:mb-1 [&>p]:mb-2 [&>ul]:ml-4 [&>ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : product.description ? (
            <p className="font-vremena w-full text-sm leading-relaxed break-words">
              {product.description}
            </p>
          ) : (
            <p className="font-vremena w-full text-sm leading-relaxed break-words opacity-40">
              No description available.
            </p>
          )}
        </div>
      </div>

      {/* Measurements — PDP only, never on the product card.
          Renders nothing when the custom.measurements metafield is unset. */}
      <Measurements metafield={product.measurements} index={3} />
    </div>
  );
}
