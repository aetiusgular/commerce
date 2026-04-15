"use client";

import type { Article } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/installations/${article.handle}`}
      className="group flex flex-col w-full"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
        {article.image ? (
          <Image
            src={article.image.url}
            alt={article.image.altText || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200" />
        )}
      </div>

      <div className="mt-4 font-vremena tracking-[-0.04em]">
        <p className="text-xs text-black/40 mb-0.5">{article.blog.title}</p>
        <p className="text-sm text-black">{article.title}</p>
        <p className="text-xs text-black/60 mt-0.5">{formatDate(article.publishedAt)}</p>
        {article.tags.length > 0 && (
          <p className="text-xs text-black/40 mt-0.5">{article.tags.join(", ")}</p>
        )}
      </div>
    </Link>
  );
}

export function ArticleGrid({
  articles,
  blogs,
}: {
  articles: Article[];
  blogs: { handle: string; title: string }[];
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const visible =
    activeFilter === null
      ? articles
      : articles.filter((a) => a.blog.handle === activeFilter);

  return (
    <>
      {blogs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveFilter(null)}
            className={`font-vremena tracking-[-0.04em] text-xs px-3 py-1 border transition-colors ${
              activeFilter === null
                ? "border-black bg-black text-white"
                : "border-black/20 text-black/60 hover:border-black hover:text-black"
            }`}
          >
            All
          </button>
          {blogs.map((blog) => (
            <button
              key={blog.handle}
              onClick={() =>
                setActiveFilter(
                  activeFilter === blog.handle ? null : blog.handle
                )
              }
              className={`font-vremena tracking-[-0.04em] text-xs px-3 py-1 border transition-colors ${
                activeFilter === blog.handle
                  ? "border-black bg-black text-white"
                  : "border-black/20 text-black/60 hover:border-black hover:text-black"
              }`}
            >
              {blog.title}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="font-vremena text-sm text-black/50">No articles yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}
