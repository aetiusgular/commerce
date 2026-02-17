import { AddToCart } from "components/cart/add-to-cart";
import { Product } from "lib/shopify/types";
import { Cookie } from "./cookie";
import { Division } from "./division";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({ product }: { product: Product }) {
  // DEBUG: Log what we're getting
  console.log('Product data:', {
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    title: product.title
  });

  const colorOption = product.options.find(
    (opt) => opt.name.toLowerCase() === "color"
  );
  const colorValues = colorOption?.values.join(" / ") || "";

  return (
    <div className="flex flex-col gap-y-8 [&>h1]:font-vremena [&>span]:font-vremena tracking-tight">
      {/* Product Section */}
      <div className="flex flex-col">
        <Cookie index={1} text="Product" />
        <h1 className="text-2xl tracking-tight">{product.title}</h1>
        {colorValues && <span className="text-xs">{colorValues}</span>}
        
        <Division height="4" />

        <div className="flex flex-col">
          <span className="text-xs font-vremena -mb-0.5">
            {parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}{" "}
            {product.priceRange.minVariantPrice.currencyCode}
          </span>
          <span className="text-xs font-vremena opacity-40">
            Taxes and duties included
          </span>
        </div>

        <Division height="4" />

        <VariantSelector options={product.options} variants={product.variants} />

        <Division height="4" />

        <AddToCart product={product} />
      </div>

      {/* Description Section */}
      <div className="flex flex-col">
        <Cookie index={2} text="Description" />
        <div className="flex flex-col gap-y-1 text-justify max-w-prose pb-2">
          {product.descriptionHtml ? (
            <div
              className="pt-1 w-full text-sm font-vremena break-words leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>li]:mb-1"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : product.description ? (
            <p className="w-full text-sm font-vremena break-words leading-relaxed">
              {product.description}
            </p>
          ) : (
            <p className="w-full text-sm font-vremena break-words leading-relaxed opacity-40">
              No description available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}