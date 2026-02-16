import clsx from "clsx";
import { getCollections, getProducts } from "lib/shopify";
import { Suspense } from "react";
import FilterList from "./filter";
import FilterItemDropdown from "./filter/dropdown";

async function CollectionList() {
  // Fetch collections for categories
  const allCollections = await getCollections();
  const collections = allCollections.filter(c => c.handle !== "");
  
  // Fetch all products to extract brands and colors
  const products = await getProducts({});
  
  // Extract unique brands (vendors)
  const brandsSet = new Set<string>();
  products.forEach(product => {
    if (product.vendor) {
      brandsSet.add(product.vendor);
    }
  });
  const brands = Array.from(brandsSet).sort().map(brand => ({
    title: brand,
    path: `/shop?vendor=${encodeURIComponent(brand)}`
  }));
  
  // Extract unique colors from product tags (case-insensitive deduplication)
  const colorsMap = new Map<string, string>();
  products.forEach(product => {
    product.tags.forEach(tag => {
      let colorName: string | null = null;
      if (tag.toLowerCase().startsWith('color:')) {
        colorName = tag.replace(/^color:/i, '').trim();
      } else if (['black', 'grey', 'gray', 'white', 'ivory', 'brown', 'beige', 'silver', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange'].includes(tag.toLowerCase())) {
        colorName = tag;
      }
      if (colorName) {
        const key = colorName.toLowerCase();
        // Keep the capitalized version (e.g., "Black" over "black")
        if (!colorsMap.has(key) || colorName[0] === colorName[0]?.toUpperCase()) {
          colorsMap.set(key, colorName);
        }
      }
    });
  });
  const colors = Array.from(colorsMap.values()).sort().map(color => ({
    title: color,
    path: `/shop?color=${encodeURIComponent(color)}`
  }));
  
  // Prepare sections for mobile dropdown
  const mobileSections = [
    {
      title: "Categories",
      items: collections.map(c => ({ title: c.title, path: c.path }))
    },
    {
      title: "Brands",
      items: brands
    },
    ...(colors.length > 0 ? [{
      title: "Colors",
      items: colors
    }] : [])
  ];
  
  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden md:flex flex-col gap-8">
        <FilterList list={collections} title="Categories" />
        <FilterList list={brands} title="Brands" />
        {colors.length > 0 && <FilterList list={colors} title="Colors" />}
      </div>
      
      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <FilterItemDropdown sections={mobileSections} />
      </div>
    </>
  );
}

const skeleton = "mb-3 h-4 w-5/6 animate-pulse rounded-sm";
const activeAndTitles = "bg-neutral-800 dark:bg-neutral-300";
const items = "bg-neutral-400 dark:bg-neutral-700";

export default function Collections() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CollectionList />
    </Suspense>
  );
}