import Link from "next/link";

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
    <div className="flex flex-col gap-2 border border-black/20 px-6 lg:px-10 pt-6 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <h2 className="font-vremena tracking-[-0.04em] text-base">
         — {num} / {title}
      </h2>
      <span className="font-vremena text-xs text-black/40 tracking-[-0.02em] sm:flex-1 sm:px-6">
        {count}
      </span>
      <Link
        href={linkHref}
        className="font-vremena text-xs tracking-[-0.02em] hover:underline underline-offset-2"
      >
        {linkText}
      </Link>
    </div>
  );
}
