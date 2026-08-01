import { getInstallations } from "lib/shopify";
import { SectionHead } from "./section-head";
import { WeekFeed, type WeekItem } from "./week-feed";

const fmtDate = (s: string): string => {
  const d = new Date(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
};

/** Estimated read time when the metafield isn't set (~220 wpm). */
const estimateReadTime = (html: string): string => {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
};

/** Strip tags + decode the handful of entities Shopify bodies actually emit. */
const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/**
 * Build a dek from an article that ALWAYS ends on a full sentence (period),
 * aiming for a 25–40 word window. Adds whole sentences; keeps the fullest set
 * that stays within 40 words and reaches 25. If no boundary lands in the
 * window (e.g. one very long or very short sentence), it rounds to the nearest
 * sentence boundary — so the result is never cut mid-sentence.
 */
const deriveExcerpt = (raw: string, min = 25, max = 40): string => {
  const text = stripHtml(raw);
  if (!text) return "";

  const sentences = (text.match(/[^.!?]+[.!?]+/g) ?? [text]).map((s) =>
    s.trim(),
  );

  // Cumulative sentence-boundary snapshots.
  const cum: { text: string; words: number }[] = [];
  let acc = "";
  for (const s of sentences) {
    acc = acc ? `${acc} ${s}` : s;
    cum.push({ text: acc, words: wordCount(acc) });
  }

  // Prefer the fullest boundary that sits inside [min, max].
  const inWindow = cum.filter((c) => c.words >= min && c.words <= max);
  if (inWindow.length) return inWindow[inWindow.length - 1]!.text;

  // Otherwise pick the boundary closest to the window (round down or up).
  let best = cum[0]!;
  let bestDist = Infinity;
  for (const c of cum) {
    const dist = c.words < min ? min - c.words : c.words - max;
    if (Math.abs(dist) < bestDist) {
      bestDist = Math.abs(dist);
      best = c;
    }
  }
  const out = best.text.trim();
  return /[.!?]$/.test(out) ? out : `${out}.`;
};

/** 01 / This week — the rotating Installations (written-article) feed. */
export async function ThisWeek() {
  const articles = await getInstallations();
  if (articles.length === 0) return null;

  const items: WeekItem[] = articles.slice(0, 7).map((a) => ({
    cat: a.category || a.blog.title || "Installation",
    date: fmtDate(a.publishedAt),
    readTime: a.readTime || estimateReadTime(a.contentHtml || a.excerpt || ""),
    title: a.title,
    dek: deriveExcerpt(a.excerpt || a.contentHtml || ""),
    by: a.author.name || "",
    imageUrl: a.image?.url ?? null,
    imageAlt: a.image?.altText || a.title,
    href: `/installations/${a.handle}`,
  }));

  return (
    <div className="agmnt-home">
      <SectionHead
        num="01"
        title="This week"
        count={`${articles.length} article${articles.length === 1 ? "" : "s"} · updated weekly`}
        linkText="View all →"
        linkHref="/installations"
      />
      <WeekFeed items={items} />
    </div>
  );
}
