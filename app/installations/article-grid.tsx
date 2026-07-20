"use client";

import type { Article } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

const catOf = (a: Article) => a.category || a.blog.title;

function StoryCard({ article }: { article: Article }) {
  return (
    <Link href={`/installations/${article.handle}`} className="jr-card">
      <div className="jr-card-img">
        {article.image?.url && (
          <Image
            src={article.image.url}
            alt={article.image.altText || article.title}
            fill
            sizes="(min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw"
          />
        )}
      </div>
      <div className="jr-card-meta">
        <span className="cat">{catOf(article)}</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
      <h3 className="jr-card-title">{article.title}</h3>
      {article.excerpt && <p className="jr-card-dek">{article.excerpt}</p>}
      <div className="jr-card-by">
        <span>{article.author.name ? `By ${article.author.name}` : ""}</span>
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

export function ArticleGrid({
  articles,
  categories,
  contributors,
}: {
  articles: Article[];
  categories: { key: string; label: string; count: number }[];
  contributors: string[];
}) {
  const [cat, setCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [contributor, setContributor] = useState("all");
  const [sort, setSort] = useState("latest");
  const [view, setView] = useState<"grid" | "index">("grid");

  const filtering =
    cat !== "all" || query.trim() !== "" || contributor !== "all";

  const visible = useMemo(() => {
    let list = articles.filter((a) => {
      if (cat !== "all" && catOf(a) !== cat) return false;
      if (contributor !== "all" && a.author.name !== contributor) return false;
      if (query.trim()) {
        const hay =
          `${a.title} ${a.excerpt} ${a.author.name} ${catOf(a)}`.toLowerCase();
        if (!hay.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "oldest") list = [...list].reverse();
    else if (sort === "az")
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [articles, cat, contributor, query, sort]);

  // Featured hero only shows in the default, unfiltered state.
  const featured = !filtering && sort === "latest" ? visible[0] : undefined;
  const rest = featured ? visible.slice(1) : visible;

  return (
    <>
      <div className="jr-toolbar">
        <div className="jr-tabs">
          <button
            className={`jr-tab ${cat === "all" ? "on" : ""}`}
            onClick={() => setCat("all")}
          >
            All stories <span className="ct">{articles.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.key}
              className={`jr-tab ${cat === c.key ? "on" : ""}`}
              onClick={() => setCat(c.key)}
            >
              {c.label} <span className="ct">{c.count}</span>
            </button>
          ))}
        </div>

        <div className="jr-tools">
          <input
            className="jr-search"
            placeholder="Search the journal"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {contributors.length > 0 && (
            <select
              className="jr-select"
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              aria-label="Filter by contributor"
            >
              <option value="all">Contributor · all</option>
              {contributors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          <select
            className="jr-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
          >
            <option value="latest">Sort · latest</option>
            <option value="oldest">Sort · oldest</option>
            <option value="az">Sort · A–Z</option>
          </select>
          <div className="jr-viewtoggle">
            <button
              className={view === "grid" ? "on" : ""}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={view === "index" ? "on" : ""}
              onClick={() => setView("index")}
            >
              Index
            </button>
          </div>
        </div>
      </div>

      {/* Featured hero */}
      {featured && view === "grid" && (
        <div className="jr-featured">
          <Link
            href={`/installations/${featured.handle}`}
            className="jr-feat-img"
          >
            {featured.image?.url && (
              <Image
                src={featured.image.url}
                alt={featured.image.altText || featured.title}
                fill
                sizes="60vw"
                priority
              />
            )}
            <span className="jr-feat-badge">Featured — Issue 14</span>
          </Link>
          <div className="jr-feat-body">
            <div className="jr-feat-kicker">
              <span className="cat">{catOf(featured)}</span>
              <span>·</span>
              <span>{formatDate(featured.publishedAt)}</span>
              {featured.readTime && (
                <>
                  <span>·</span>
                  <span>{featured.readTime}</span>
                </>
              )}
            </div>
            <h2 className="jr-feat-title">{featured.title}</h2>
            {featured.excerpt && (
              <p className="jr-feat-dek">{featured.excerpt}</p>
            )}
            <div className="jr-feat-foot">
              {featured.author.name && (
                <span className="jr-feat-by">
                  By <strong>{featured.author.name}</strong>
                </span>
              )}
              <Link
                href={`/installations/${featured.handle}`}
                className="jr-read"
              >
                Read the story <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="jr-divider">
          {featured
            ? `${rest.length} stories + featured`
            : `${rest.length} ${rest.length === 1 ? "story" : "stories"}`}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="jr-empty">No stories match.</p>
      ) : view === "grid" ? (
        <div className="jr-grid">
          {rest.map((a) => (
            <StoryCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <div className="jr-index">
          {visible.map((a, i) => (
            <Link
              key={a.id}
              href={`/installations/${a.handle}`}
              className="jr-row"
            >
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="cat">{catOf(a)}</span>
              <span className="ti">{a.title}</span>
              <span className="au">{a.author.name}</span>
              <span className="dt">{formatDate(a.publishedAt)}</span>
              <span className="rt">{a.readTime || ""}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
