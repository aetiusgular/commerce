import { getCollections, getProducts } from "lib/shopify";
import { Suspense } from "react";
import FilterItemDropdown from "./filter/dropdown";
import FilterBar from "./filter/filter-bar";

async function CollectionList() {
  // Fetch collections for categories
  const allCollections = await getCollections();
  const collections = allCollections.filter((c) => c.handle !== "");

  // Fetch all products to extract brands and colors
  const products = await getProducts({});

  // Extract unique brands (vendors)
  const brandsSet = new Set<string>();
  products.forEach((product) => {
    if (product.vendor) {
      brandsSet.add(product.vendor);
    }
  });
  const brands = Array.from(brandsSet)
    .sort()
    .map((brand) => ({
      title: brand,
      path: `/shop?vendor=${encodeURIComponent(brand)}`,
    }));

  // Extract unique colors from product tags (case-insensitive deduplication)
  const colorsMap = new Map<string, string>();
  products.forEach((product) => {
    product.tags.forEach((tag) => {
      let colorName: string | null = null;
      if (tag.toLowerCase().startsWith("color:")) {
        colorName = tag.replace(/^color:/i, "").trim();
      } else if (
        [
          "black",
          "grey",
          "gray",
          "white",
          "ivory",
          "brown",
          "beige",
          "silver",
          "red",
          "blue",
          "green",
          "yellow",
          "pink",
          "purple",
          "orange",
        ].includes(tag.toLowerCase())
      ) {
        colorName = tag;
      }
      if (colorName) {
        const key = colorName.toLowerCase();
        // Keep the capitalized version (e.g., "Black" over "black")
        if (
          !colorsMap.has(key) ||
          colorName[0] === colorName[0]?.toUpperCase()
        ) {
          colorsMap.set(key, colorName);
        }
      }
    });
  });
  const colors = Array.from(colorsMap.values())
    .sort()
    .map((color) => ({
      title: color,
      path: `/shop?color=${encodeURIComponent(color)}`,
    }));

  // Prepare sections for mobile dropdown
  const mobileSections = [
    {
      title: "Categories",
      items: collections.map((c) => ({ title: c.title, path: c.path })),
    },
    {
      title: "Brands",
      items: brands,
    },
    ...(colors.length > 0
      ? [
          {
            title: "Colors",
            items: colors,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop: compact horizontal filter bar above the grid.
          Replaces the old 200px vertical sidebar so products get full width. */}
      <FilterBar sections={mobileSections} resultCount={products.length} />

      {/* Mobile Dropdown */}
      <div className="mb-4 md:hidden">
        <FilterItemDropdown sections={mobileSections} />
      </div>
    </>
  );
}

export default function Collections() {
  return (
    <Suspense
      fallback={
        <div className="mb-6 h-9 w-full animate-pulse rounded-sm bg-neutral-100" />
      }
    >
      <CollectionList />
    </Suspense>
  );
}
