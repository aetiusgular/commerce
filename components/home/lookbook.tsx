import { getCollectionProducts, getProducts } from "lib/shopify";
import type { Product } from "lib/shopify/types";
import { productPath } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { SectionHead } from "./section-head";

const SUBTITLES = [
  "Workwear reconsidered",
  "Off-duty tailoring",
  "The cotton question",
];

export async function Lookbook() {
  // Prefer a curated `lookbook` collection if it exists; otherwise fall back to
  // the three most recent products' featured images.
  let looks: Product[] = await getCollectionProducts({
    collection: "lookbook",
  });

  if (looks.length === 0) {
    const recent = await getProducts({
      sortKey: "CREATED_AT",
      reverse: true,
    });
    looks = recent.slice(0, 3);
  } else {
    looks = looks.slice(0, 3);
  }

  if (looks.length === 0) return null;

  return (
    <section id="lookbook">
      <SectionHead
        num="04"
        title="Gallery"
        count={`${looks.length} looks · styled by the AGMNT`}
        linkText="Open the gallery →"
        linkHref="/shop"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-2 px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-12 lg:pb-16">
        {looks.map((look, i) => {
          const num = String(i + 1).padStart(2, "0");
          const sub = SUBTITLES[i] ?? look.vendor ?? "";
          return (
            <Link
              key={look.handle}
              href={productPath(look)}
              className="group flex flex-col"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                {look.featuredImage && (
                  <Image
                    src={look.featuredImage.url}
                    alt={look.featuredImage.altText || look.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                )}
              </div>

              <div className="mt-3 font-vremena text-sm tracking-[-0.04em]">
                Look {num} <em className="not-italic text-black/60">— {sub}</em>
              </div>
              <div className="mt-1 flex items-center justify-between font-vremena text-[10px] uppercase tracking-[-0.02em] text-black/50">
                <span>
                  Look {num} / {String(looks.length).padStart(2, "0")}
                </span>
                <span className="group-hover:text-black transition-colors">
                  Shop the look →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
