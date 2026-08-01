import Link from "next/link";

/** Section header — v6 `.shead`: bottom hairline, 14.5px title, muted count,
 *  "View all →" pushed right. Shared by sections 01 / 02 / 03. */
export function SectionHead({
  num,
  title,
  count,
  linkText,
  linkHref,
}: {
  num: string;
  title: string;
  count: string;
  linkText: string;
  linkHref: string;
}) {
  return (
    <div className="shead">
      <h2>
        — {num} / {title}
      </h2>
      <span className="cnt">{count}</span>
      <Link href={linkHref} className="all">
        {linkText}
      </Link>
    </div>
  );
}
