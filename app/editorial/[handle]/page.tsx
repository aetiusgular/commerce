import Footer from "components/layout/footer";
import { getArticle, getEditorials } from "lib/shopify";
import type { Image as ShopImage } from "lib/shopify/types";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await props.params;
  const article = await getArticle(handle);
  if (!article) return notFound();

  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: `/editorial/${handle}` },
    openGraph: article.image
      ? {
          images: [
            {
              url: article.image.url,
              width: article.image.width,
              height: article.image.height,
              alt: article.image.altText,
            },
          ],
        }
      : undefined,
  };
}

const fmtDate = (s: string): string => {
  const d = new Date(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
};

const ratioOf = (img: ShopImage): number =>
  img.width && img.height ? img.width / img.height : 1;

/** Reduced "w:h" label from real pixel dimensions (e.g. 3:4, 16:9). */
const arLabel = (img: ShopImage): string => {
  if (!img.width || !img.height) return "";
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const g = gcd(img.width, img.height) || 1;
  return `${Math.round(img.width / g)}:${Math.round(img.height / g)}`;
};

/**
 * Justified rows: walk the gallery in order, filling a row until the summed
 * aspect ratios reach a target width, then break. Every photo the team uploads
 * lands in a balanced multi-up layout with no manual arrangement.
 */
function buildRows(images: ShopImage[]): ShopImage[][] {
  const TARGET = 2.55;
  const rows: ShopImage[][] = [];
  let row: ShopImage[] = [];
  let sum = 0;
  for (const img of images) {
    const r = Math.min(Math.max(ratioOf(img), 0.5), 2.4);
    row.push(img);
    sum += r;
    if (sum >= TARGET) {
      rows.push(row);
      row = [];
      sum = 0;
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

export default async function EditorialFolioPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const [article, editorials] = await Promise.all([
    getArticle(handle),
    getEditorials(),
  ]);

  if (!article) return notFound();

  const gallery = article.gallery ?? [];
  const hero = article.image ?? gallery[0] ?? null;
  const plate = article.image ? gallery : gallery.slice(1);
  const rows = buildRows(plate);
  const total = (hero ? 1 : 0) + plate.length;

  const category = article.category || "Editorial";
  const season = article.season || "";

  const credits: [string, string][] = [
    ...(article.photography
      ? ([["Photography", article.photography]] as [string, string][])
      : []),
    ...(article.styling
      ? ([["Styling", article.styling]] as [string, string][])
      : []),
    ...(article.location
      ? ([["Location", article.location]] as [string, string][])
      : []),
    ["Photos", String(total)],
    ["Published", fmtDate(article.publishedAt)],
  ];

  // Prev / next within the Editorial blog.
  const idx = editorials.findIndex((e) => e.handle === handle);
  const prev =
    idx >= 0
      ? editorials[(idx - 1 + editorials.length) % editorials.length]
      : null;
  const next = idx >= 0 ? editorials[(idx + 1) % editorials.length] : null;
  const sibling = prev && next && prev.handle !== handle;

  let plateIndex = hero ? 1 : 0;

  return (
    <div className="agmnt-folio">
      <nav className="crumb">
        <a href="/editorial">Editorial</a>
        <span className="sp">/</span>
        <span>{season || category}</span>
        <span className="sp">/</span>
        <b>{article.title}</b>
      </nav>

      {hero && (
        <div className="fhero">
          <Image
            src={hero.url}
            alt={hero.altText || `${article.title} — ${season}`}
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover" }}
          />
          <span className="tg">
            {category} — 01 / {String(total).padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="fmast">
        <div>
          <h1>{article.title}</h1>
          {(season || category) && (
            <div className="season">
              {season}
              {season && category ? " " : ""}
              {category && <em>— {category}</em>}
            </div>
          )}
        </div>
        <div className="fdesc">
          <div className="k">The shoot</div>
          {article.contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
          ) : article.excerpt ? (
            <p>{article.excerpt}</p>
          ) : null}
        </div>
      </div>

      {credits.length > 0 && (
        <div
          className="fcred"
          style={{ gridTemplateColumns: `repeat(${credits.length}, 1fr)` }}
        >
          {credits.map(([k, v]) => (
            <div key={k}>
              <div className="k">{k}</div>
              <div className="v">{v}</div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="fplate">
          {rows.map((row, ri) => (
            <div className="fo-row" key={ri}>
              {row.map((img) => {
                const n = String(++plateIndex).padStart(2, "0");
                const label = arLabel(img);
                return (
                  <div
                    className="cell"
                    key={img.url}
                    style={{ flex: Math.min(Math.max(ratioOf(img), 0.5), 2.4) }}
                  >
                    <span
                      className="fr"
                      style={{
                        aspectRatio:
                          img.width && img.height
                            ? `${img.width}/${img.height}`
                            : "1",
                      }}
                    >
                      <Image
                        src={img.url}
                        alt={img.altText || `${article.title} — ${n}`}
                        fill
                        sizes="(min-width: 820px) 50vw, 100vw"
                        style={{ objectFit: "cover" }}
                      />
                    </span>
                    <span className="cap">
                      <span className="n">{n}</span>
                      <span className="t">{img.altText || `Plate ${n}`}</span>
                      {label && <span className="f">{label}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {sibling && prev && next && (
        <div className="fnav">
          <a href={`/editorial/${prev.handle}`}>
            <div className="k">Previous story</div>
            <div className="t">{prev.title}</div>
            <div className="s">{prev.season || prev.category}</div>
          </a>
          <a href={`/editorial/${next.handle}`}>
            <div className="k">Next story</div>
            <div className="t">{next.title}</div>
            <div className="s">{next.season || next.category}</div>
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}
