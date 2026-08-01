import { getEditorials } from "lib/shopify";
import Image from "next/image";
import Link from "next/link";
import { RadioPlayer } from "./radio-player";
import { SectionHead } from "./section-head";

const fmtDate = (s: string): string => {
  const d = new Date(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
};

/**
 * 03 / Editorial — the two most recent campaign folios + AGMNT Radio.
 * Same layout as the v6 reference (.ed / .ec), content sourced from the
 * Editorial (campaign) blog rather than written articles.
 */
export async function Dispatch() {
  const campaigns = await getEditorials();
  const featured = campaigns.slice(0, 2);

  return (
    <div className="agmnt-home">
      <SectionHead
        num="03"
        title="Editorial"
        count={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`}
        linkText="View all →"
        linkHref="/editorial"
      />

      <section className="ed" id="editorial">
        {featured.length === 0 ? (
          <div className="ec ec-empty" />
        ) : (
          featured.map((c) => (
            <article className="ec" key={c.id}>
              <Link className="ec-img" href={`/editorial/${c.handle}`}>
                {c.image?.url && (
                  <Image
                    src={c.image.url}
                    alt={c.image.altText || c.title}
                    fill
                    sizes="(min-width: 1180px) 33vw, 100vw"
                    style={{ objectFit: "cover" }}
                  />
                )}
              </Link>
              <div className="ec-meta">
                <span className="c">{c.category || "Campaign"}</span>
                <span>·</span>
                <span>{fmtDate(c.publishedAt)}</span>
                {c.location && (
                  <>
                    <span>·</span>
                    <span>{c.location}</span>
                  </>
                )}
              </div>
              <h3>
                <Link href={`/editorial/${c.handle}`}>
                  {c.season ? `${c.title} — ${c.season}` : c.title}
                </Link>
              </h3>
              {c.photography && (
                <div className="ec-by">
                  Photography <b>{c.photography}</b>
                </div>
              )}
            </article>
          ))
        )}

        <div id="radio" className="ec-radio">
          <RadioPlayer />
        </div>
      </section>
    </div>
  );
}
