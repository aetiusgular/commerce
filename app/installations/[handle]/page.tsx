import { getArticle } from "lib/shopify";
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
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ArticlePage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const article = await getArticle(handle);

  if (!article) return notFound();

  return (
    <article>
      {/* Hero image */}
      {article.image && (
        <div className="relative w-full max-h-[70vh] overflow-hidden">
          <Image
            src={article.image.url}
            alt={article.image.altText || article.title}
            width={article.image.width}
            height={article.image.height}
            className="w-full max-h-[70vh] object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/installations"
          className="font-vremena text-xs tracking-[-0.04em] text-black/50 hover:text-black transition-colors mb-8 inline-block"
        >
          ← Installations
        </Link>

        {/* Blog name */}
        <p className="font-vremena text-xs tracking-[-0.04em] text-black/40 mt-4 mb-2">
          {article.blog.title}
        </p>

        {/* Title */}
        <h1 className="font-vremena tracking-[-0.04em] text-3xl sm:text-4xl mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 font-vremena text-xs text-black/50 tracking-[-0.04em] mb-8">
          {article.author.name && <span>{article.author.name}</span>}
          {article.author.name && <span>·</span>}
          <span>{formatDate(article.publishedAt)}</span>
          {article.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-black/20 px-2 py-0.5 text-xs font-vremena tracking-[-0.02em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div
          className="prose prose-neutral max-w-none font-vremena tracking-[-0.02em]
            prose-headings:font-vremena prose-headings:tracking-[-0.04em]
            prose-a:text-black prose-a:underline prose-a:underline-offset-2
            prose-img:w-full prose-img:rounded-none
            prose-blockquote:border-l-black/20 prose-blockquote:font-normal prose-blockquote:not-italic"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </div>
    </article>
  );
}
