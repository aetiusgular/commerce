import { getCollections, getProducts } from "lib/shopify";
import { SectionHead } from "./section-head";
import { SelectionGrid } from "./selection-grid";

// Deterministic shuffle seeded by the UTC week index — same order for all
// visitors during a 7-day window, rotates at midnight UTC every Monday.
function weeklyShuffle<T>(items: T[]): T[] {
  const msPerDay = 86_400_000;
  const daysSinceEpoch = Math.floor(Date.now() / msPerDay);
  // Unix epoch (1970-01-01) was a Thursday; subtract 3 so weeks roll over on Monday.
  let state = Math.floor((daysSinceEpoch - 3) / 7);
  const rand = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export async function ShopSection() {
  const [products, collections] = await Promise.all([
    getProducts({ sortKey: "CREATED_AT", reverse: true }),
    getCollections(),
  ]);

  const featured = weeklyShuffle(products).slice(0, 4);

  // Total collection count for the header stat (excludes the synthetic "All"
  // collection whose handle is empty).
  const totalCollections = collections.filter((c) => c.handle !== "").length;

  // The rail lists only real category / department collections — never the
  // per-brand collections (title === a vendor) or the Archive collection — and
  // is capped so it can never run taller than the four product cards, which is
  // what was creating the dead space.
  const brandNames = new Set(
    products.map((p) => p.vendor?.toLowerCase()).filter(Boolean),
  );
  const categoryCollections = collections
    .filter(
      (c) =>
        c.handle !== "" &&
        c.title.toLowerCase() !== "archive" &&
        !brandNames.has(c.title.toLowerCase()),
    )
    .slice(0, 10);

  return (
    <div className="agmnt-home" id="shop">
      <SectionHead
        num="02"
        title="Shop"
        count={`${products.length} pieces, ${totalCollections} collections`}
        linkText="View all →"
        linkHref="/shop"
      />

      <SelectionGrid
        categories={categoryCollections.map((c) => ({
          handle: c.handle,
          title: c.title,
          path: c.path,
        }))}
        products={featured}
      />
    </div>
  );
}
