import { getCollections, getProducts } from "lib/shopify";
import Link from "next/link";
import { SectionHead } from "./section-head";
import { ShopCard } from "./shop-card";

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
  // Skip the synthetic "All" collection (handle === "") in the sidebar list.
  const filterCollections = collections.filter((c) => c.handle !== "");

  return (
    <section id="shop">
      <SectionHead
        num="02"
        title="Shop"
        count={`${products.length} pieces, ${filterCollections.length} collections`}
        linkText="View all →"
        linkHref="/shop"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-8 px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-6">
        {/* Sidebar */}
        <aside className="flex flex-col min-w-0">
          <div className="font-vremena text-base tracking-[-0.04em]">
            This weeks <em className="text-black/50">selection</em>
          </div>
          <div className="font-vremena text-[10px] uppercase tracking-[-0.02em] text-black/40 mt-1 mb-4 lg:mb-6">
            Curated by the AGMNT buying desk
          </div>

          <nav
            className="flex flex-row lg:flex-col gap-2 lg:gap-0 overflow-x-auto lg:overflow-x-visible scrollbar-hide -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 pb-1 lg:pb-0"
          >
            {filterCollections.map((c) => (
              <Link
                key={c.handle}
                href={c.path}
                className="flex items-center justify-between gap-2 lg:gap-0 flex-shrink-0 lg:flex-shrink whitespace-nowrap lg:whitespace-normal px-3 py-2 lg:px-0 lg:py-1.5 border lg:border-0 border-black/15 lg:border-b lg:border-black/10 lg:rounded-none font-vremena text-[11px] tracking-[-0.02em] hover:text-black text-black/70"
              >
                <span className="capitalize">{c.title}</span>
                <span className="text-black/40">→</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Product grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 min-w-0">
          {featured.map((p, i) => (
            <ShopCard key={p.handle} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
