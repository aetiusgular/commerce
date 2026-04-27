import { getArticles } from "lib/shopify";
import { ArticleCard } from "./article-card";
import { RadioPlayer } from "./radio-player";
import { SectionHead } from "./section-head";

export async function Dispatch() {
  const articles = await getArticles();
  const featured = articles.slice(0, 2);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = articles.filter(
    (a) => new Date(a.publishedAt).getTime() >= sevenDaysAgo
  ).length;

  return (
    <section id="editorial">
      <SectionHead
        num="03"
        title="Installations"
        count={`This week's reading · ${recentCount} stories`}
        linkText="All stories →"
        linkHref="/installations"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-6">
        {featured.length === 0 ? (
          <div className="md:col-span-2 font-vremena text-sm text-black/50">
            No articles yet — check back soon.
          </div>
        ) : (
          featured.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
        <div id="radio" className="md:col-span-2 lg:col-span-1">
          <RadioPlayer />
        </div>
      </div>
    </section>
  );
}
