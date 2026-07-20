import { ArticleShare } from "components/installations/article-share";
import { getArticle, getArticles } from "lib/shopify";
import type { Article, Image as ShopImage } from "lib/shopify/types";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

function formatDate(dateString: string): string {
  // Reference uses DD.MM.YY.
  const d = new Date(dateString);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

/** Estimated read time when the metafield isn't set (~220 wpm). */
function estimateReadTime(html: string): string {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

/** Pairs the gallery so two images render side-by-side (fig-two), like the reference. */
function pairs<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

export default async function ArticlePage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const article = await getArticle(handle);

  if (!article) return notFound();

  const readTime = article.readTime || estimateReadTime(article.contentHtml);
  const more = (await getArticles())
    .filter((a) => a.handle !== article.handle)
    .slice(0, 3);

  // Continue the figure numbering after the hero image.
  let figNo = article.image ? 1 : 0;

  return (
    <div className="agmnt-editorial">
      <nav className="crumb">
        <Link href="/installations">Editorial</Link>
        <span className="sep">/</span>
        <Link href="/installations">Installations</Link>
        <span className="sep">/</span>
        <span className="here">{article.title}</span>
      </nav>

      <header className="art-head">
        <div className="art-kicker">
          {article.category && <span className="cat">{article.category}</span>}
          {article.category && <span>·</span>}
          <span>{formatDate(article.publishedAt)}</span>
          <span>·</span>
          <span>{readTime}</span>
        </div>

        <h1 className="art-title">{article.title}</h1>

        {article.excerpt && <p className="art-dek">{article.excerpt}</p>}

        <div className="art-meta">
          {article.author.name && (
            <span className="by">
              By <strong>{article.author.name}</strong>
            </span>
          )}
          {article.author.name && article.photography && (
            <span className="dot" />
          )}
          {article.photography && (
            <span>Photography — {article.photography}</span>
          )}
        </div>
      </header>

      <article className="art-body">
        {/* Hero — near full-bleed lead image */}
        {article.image && (
          <figure className="fig-full">
            <Image
              className="art-img"
              src={article.image.url}
              alt={article.image.altText || article.title}
              width={article.image.width || 1600}
              height={article.image.height || 900}
              priority
            />
            <figcaption>
              <span className="n">01</span>
              <span>{article.image.altText || article.title}</span>
            </figcaption>
          </figure>
        )}

        {/* Merchant-authored body (Shopify rich text). Inline images break out
            wide automatically via .art-html CSS. */}
        <div
          className="art-html"
          data-testid="article-body"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {/* Extra images from the custom.gallery metafield — rendered two-up on
            desktop, stacked on mobile, exactly like the reference. */}
        {pairs(article.gallery).map((pair, i) => (
          <div
            className={pair.length === 2 ? "fig-two" : "fig-wide"}
            key={`gallery-${i}`}
            data-testid="article-gallery-row"
          >
            {pair.map((img: ShopImage) => {
              figNo += 1;
              return (
                <figure className="fig-portrait" key={img.url}>
                  <Image
                    className="art-img"
                    src={img.url}
                    alt={img.altText || `${article.title} — image ${figNo}`}
                    width={img.width || 900}
                    height={img.height || 1200}
                  />
                  <figcaption>
                    <span className="n">{String(figNo).padStart(2, "0")}</span>
                    <span>{img.altText || ""}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ))}
      </article>

      {/* End byline */}
      <div className="art-end">
        {article.author.name && (
          <div className="by">
            By <strong>{article.author.name}</strong>
            {article.author.role && (
              <span className="role">{article.author.role}</span>
            )}
          </div>
        )}
        <ArticleShare title={article.title} />
      </div>

      {/* More from Installations */}
      {more.length > 0 && (
        <section className="more">
          <div className="more-head">
            <h3>— More from Installations</h3>
            <Link href="/installations">All stories →</Link>
          </div>
          <div className="more-grid">
            {more.map((a: Article) => (
              <Link
                key={a.handle}
                href={`/installations/${a.handle}`}
                className="more-card"
              >
                <div className="thumb">
                  {a.image?.url && (
                    <Image
                      src={a.image.url}
                      alt={a.image.altText || a.title}
                      width={640}
                      height={400}
                    />
                  )}
                </div>
                <div className="m">
                  {a.category && <span className="cat">{a.category}</span>}
                  <span>{formatDate(a.publishedAt)}</span>
                  {a.readTime && <span>{a.readTime}</span>}
                </div>
                <h4>{a.title}</h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="foot">
        <span className="fl">AGMNT</span>
        <span className="fr">Issue 14 · Spring / Summer 2026</span>
      </footer>
    </div>
  );
}
