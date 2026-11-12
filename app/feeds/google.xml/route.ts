import { getFeedProducts } from "lib/shopify";
import type { FeedProduct } from "lib/shopify/types";
import { baseUrl, productPath } from "lib/utils";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace), one item per
 * variant, US market, base USD prices. Merchant Center fetches this URL on a
 * schedule. Shipping and returns live in Merchant Center account settings, not
 * per item.
 *
 * Item IDs use Shopify's own format (shopify_US_<product>_<variant>) so the
 * feed can later move to Shopify's Google app without resetting history.
 */
export const dynamic = "force-dynamic";

const COLORS = [
  "Black",
  "White",
  "Ivory",
  "Grey",
  "Gray",
  "Charcoal",
  "Brown",
  "Blue",
  "Navy",
  "Green",
  "Olive",
  "Red",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Beige",
  "Cream",
  "Khaki",
  "Silver",
  "Gold",
];

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const numericId = (gid: string) => gid.split("/").pop() ?? gid;
const lc = (s: string) => s.toLowerCase();
const isSizeOption = (name: string) => lc(name).includes("size");

/** Full Shopify taxonomy path, root first. */
const categoryPath = (p: FeedProduct): string => {
  if (!p.category) return "";
  const parents = [...p.category.ancestors].reverse().map((a) => a.name);
  return [...parents, p.category.name].join(" > ");
};

/** Shopify taxonomy path → Google product taxonomy path. */
const googleCategory = (path: string): string => {
  const has = (s: string) => path.includes(s);
  if (has("Shoes")) return "Apparel & Accessories > Shoes";
  if (has("Handbags") || has("Bags"))
    return "Apparel & Accessories > Handbags, Wallets & Cases > Handbags";
  if (has("Hats")) return "Apparel & Accessories > Clothing Accessories > Hats";
  if (has("Clothing Accessories"))
    return "Apparel & Accessories > Clothing Accessories";
  if (has("Outerwear"))
    return "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets";
  if (has("Shorts")) return "Apparel & Accessories > Clothing > Shorts";
  if (has("Skirts")) return "Apparel & Accessories > Clothing > Skirts";
  if (has("Dresses")) return "Apparel & Accessories > Clothing > Dresses";
  if (has("Pants")) return "Apparel & Accessories > Clothing > Pants";
  if (has("Tops") || has("Hoodies") || has("Sweatshirts"))
    return "Apparel & Accessories > Clothing > Shirts & Tops";
  return "Apparel & Accessories > Clothing";
};

/** Unisex by default; womenswear only when the product says so. */
const gender = (title: string) =>
  /\bwom[ae]n'?s?\b|\bbaby\b|\bdress\b/i.test(title) ? "female" : "unisex";

const colorFor = (
  p: FeedProduct,
  options: { name: string; value: string }[],
): string => {
  const opt = options.find((o) => ["color", "colour"].includes(lc(o.name)));
  if (opt) return opt.value;
  const tagged = p.tags.filter((t) =>
    COLORS.some((c) => lc(c) === lc(t.trim())),
  );
  return tagged.slice(0, 3).join("/");
};

/** [Brand] [Model] [Color], per the AGMNT search-intent title rule. */
const feedTitle = (p: FeedProduct, color: string) => {
  let t = clean(p.title);
  if (p.vendor && !lc(t).includes(lc(p.vendor))) t = `${p.vendor} ${t}`;
  if (color && !lc(t).includes(lc(color))) t = `${t} ${color}`;
  return t.slice(0, 150);
};

const feedDescription = (p: FeedProduct, color: string, path: string) => {
  const body = clean(p.description.replace(/^\s*item info:\s*/i, ""));
  if (body) return body.slice(0, 5000);
  const leaf = path.split(" > ").pop() ?? "";
  return clean(
    `${p.vendor} ${p.title}${color ? ` in ${color}` : ""}.${leaf ? ` ${leaf}.` : ""}`,
  );
};

const money = (amount: string, currency: string) =>
  `${Number(amount).toFixed(2)} ${currency}`;

function items(p: FeedProduct): string[] {
  const path = categoryPath(p);
  const productId = numericId(p.id);
  const images = p.images.nodes.map((i) => i.url);
  const sizeOptionName = p.variants.nodes[0]?.selectedOptions.find((o) =>
    ["size", "sizes"].includes(lc(o.name)),
  )?.name;
  const multiVariant = p.variants.nodes.length > 1;

  return p.variants.nodes.map((v) => {
    const color = colorFor(p, v.selectedOptions);
    const size = v.selectedOptions.find((o) => isSizeOption(o.name))?.value;
    const isShoe = path.includes("Shoes");

    // Only plain "Size" options are read back by the product page.
    const sizeParam =
      multiVariant && sizeOptionName
        ? v.selectedOptions.find((o) => o.name === sizeOptionName)?.value
        : undefined;
    const link = `${baseUrl}${productPath(p)}${
      sizeParam ? `?size=${encodeURIComponent(sizeParam)}` : ""
    }`;

    const onSale =
      v.compareAtPrice &&
      Number(v.compareAtPrice.amount) > Number(v.price.amount);
    const priceTags = onSale
      ? [
          ["g:price", money(v.compareAtPrice!.amount, v.price.currencyCode)],
          ["g:sale_price", money(v.price.amount, v.price.currencyCode)],
        ]
      : [["g:price", money(v.price.amount, v.price.currencyCode)]];

    const image = v.image?.url ?? images[0];
    const extra = images.filter((u) => u !== image).slice(0, 10);

    const fields: [string, string | undefined][] = [
      ["g:id", `shopify_US_${productId}_${numericId(v.id)}`],
      ["g:item_group_id", multiVariant ? `shopify_US_${productId}` : undefined],
      ["g:title", feedTitle(p, color)],
      ["g:description", feedDescription(p, color, path)],
      ["g:link", link],
      ["g:image_link", image],
      ...extra.map((u) => ["g:additional_image_link", u] as [string, string]),
      ["g:availability", v.availableForSale ? "in_stock" : "out_of_stock"],
      ...(priceTags as [string, string][]),
      ["g:condition", "new"],
      ["g:brand", p.vendor || "AGMNT"],
      ["g:identifier_exists", "no"],
      ["g:google_product_category", googleCategory(path)],
      ["g:product_type", path || undefined],
      ["g:gender", gender(p.title)],
      ["g:age_group", "adult"],
      ["g:color", color || undefined],
      ["g:size", size],
      ["g:size_system", isShoe && size ? "US" : undefined],
    ];

    const body = fields
      .filter(([, val]) => val !== undefined && val !== "")
      .map(([k, val]) => `      <${k}>${esc(val!)}</${k}>`)
      .join("\n");
    return `    <item>\n${body}\n    </item>`;
  });
}

export async function GET() {
  const products = await getFeedProducts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AGMNT</title>
    <link>${esc(baseUrl)}</link>
    <description>AGMNT product feed</description>
${products.flatMap(items).join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
