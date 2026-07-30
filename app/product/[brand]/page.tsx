import { getProduct } from "lib/shopify";
import { productPath } from "lib/utils";
import { notFound, permanentRedirect } from "next/navigation";

/**
 * Legacy single-segment product route. Product URLs now carry the brand as
 * their own segment (`/product/<brand>/<handle>`, SSENSE-style). Any bare
 * `/product/<handle>` hit — old bookmarks or previously indexed pages —
 * 308-redirects to the branded canonical so nothing 404s and search equity is
 * preserved.
 *
 * The dynamic segment is named `brand` to share the slug name with the nested
 * `[brand]/[handle]` route (Next.js requires one name per position), but at
 * this depth the value is really the product handle.
 */
export default async function LegacyProductRedirect(props: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: handle } = await props.params;
  const product = await getProduct(handle);

  if (!product) return notFound();

  permanentRedirect(productPath(product));
}
