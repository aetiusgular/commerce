import { getArticles } from "lib/shopify";
import type { Metadata } from "next";
import { ArticleGrid } from "./article-grid";

export const metadata: Metadata = {
  title: "Editorial",
  description:
    "AGMNT editorial journal — interviews, essays, and installations.",
};

export default async function InstallationsPage() {
  const articles = await getArticles();

  // Category = article.category (custom.category metafield / first tag),
  // falling back to the Shopify blog title. Counts feed the toolbar tabs.
  const catOf = (a: (typeof articles)[number]) => a.category || a.blog.title;

  const counts = new Map<string, number>();
  for (const a of articles) {
    const c = catOf(a);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const categories = [...counts.entries()].map(([label, count]) => ({
    key: label,
    label,
    count,
  }));

  const contributors = [
    ...new Set(articles.map((a) => a.author.name).filter(Boolean)),
  ].sort();

  return (
    <ArticleGrid
      articles={articles}
      categories={categories}
      contributors={contributors}
    />
  );
}
