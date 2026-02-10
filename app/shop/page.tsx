import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProducts } from "lib/shopify";

export const metadata = {
  title: "Shop",
  description: "Shop for products in the store.",
};

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue, vendor, color } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  // Build query with filters
  let query = searchValue || "";
  if (vendor) {
    query += ` vendor:${vendor}`;
  }
  if (color) {
    query += ` tag:${color}`;
  }

  const products = await getProducts({ sortKey, reverse, query: query.trim() || undefined });
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <>
      {/* Only show message if searching OR no products found */}
      {(searchValue || products.length === 0) ? (
        <p className="mb-4 font-vremena text-sm">
          {products.length === 0
            ? "There are no products that match"
            : `Showing ${products.length} ${resultsText}`}
          {searchValue && (
            <>
              {" for "}
              <span className="font-bold">&quot;{searchValue}&quot;</span>
            </>
          )}
        </p>
      ) : null}
      {products.length > 0 ? (
        <Grid className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProductGridItems products={products} />
        </Grid>
      ) : null}
    </>
  );
}