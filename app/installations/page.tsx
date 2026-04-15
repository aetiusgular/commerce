import { getArticles } from "lib/shopify";
import type { Metadata } from "next";
import { ArticleGrid } from "./article-grid";

export const metadata: Metadata = {
  title: "Installations",
  description: "AGMNT installations and editorial features.",
};

export default async function InstallationsPage() {
  const articles = await getArticles();

  // Derive unique blogs from the article list (preserves order of first appearance).
  const blogsMap = new Map<string, { handle: string; title: string }>();
  for (const article of articles) {
    if (!blogsMap.has(article.blog.handle)) {
      blogsMap.set(article.blog.handle, article.blog);
    }
  }
  const blogs = Array.from(blogsMap.values());

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-8 pb-4">
      <ArticleGrid articles={articles} blogs={blogs} />
    </div>
  );
}
