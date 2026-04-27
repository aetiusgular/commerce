import type { Article } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";

function formatDate(dateString: string): string {
  // Format like "18.04.26"
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}.${mm}.${yy}`;
}

function readTime(html: string): string {
  // Rough estimate: 200 wpm.
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

export function ArticleCard({ article }: { article: Article }) {
  const cat = article.tags[0] || article.blog.title;

  return (
    <article className="flex flex-col">
      <Link href={`/installations/${article.handle}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          {article.image ? (
            <Image
              src={article.image.url}
              alt={article.image.altText || article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 30vw, 100vw"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200" />
          )}
        </div>
      </Link>

      <div className="mt-4 flex items-center gap-2 font-vremena text-[10px] uppercase tracking-[-0.02em] text-black/50">
        <span className="text-black">{cat}</span>
        <span>·</span>
        <span>{formatDate(article.publishedAt)}</span>
        <span>·</span>
        <span>{readTime(article.contentHtml)} read</span>
      </div>

      <Link
        href={`/installations/${article.handle}`}
        className="mt-2 font-vremena text-xl lg:text-2xl tracking-[-0.04em] leading-[1.15] hover:underline underline-offset-4"
      >
        {article.title}
      </Link>

      {article.excerpt && (
        <p className="mt-3 font-vremena text-sm tracking-[-0.02em] text-black/70 leading-relaxed">
          {article.excerpt}
        </p>
      )}

      {article.author.name && (
        <div className="mt-4 font-vremena text-xs tracking-[-0.02em] text-black/50">
          By <strong className="text-black font-normal">{article.author.name}</strong>
        </div>
      )}
    </article>
  );
}
