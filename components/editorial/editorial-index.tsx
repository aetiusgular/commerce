"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type FolioImg = {
  url: string;
  altText: string;
  w: number;
  h: number;
};

export type Folio = {
  n: string;
  handle: string;
  brand: string;
  season: string;
  cat: string;
  credits: [string, string][];
  note: string;
  photos: number;
  preview: FolioImg[];
};

const ratio = (i: FolioImg): number => (i.w && i.h ? i.w / i.h : 1);
const clampR = (i: FolioImg) => Math.min(Math.max(ratio(i), 0.5), 2.2);
const arLabel = (i: FolioImg): string => {
  if (!i.w || !i.h) return "";
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const d = g(i.w, i.h) || 1;
  return `${Math.round(i.w / d)}:${Math.round(i.h / d)}`;
};

/** Justified rows for a folio's preview strip. */
function buildRows(imgs: FolioImg[]): FolioImg[][] {
  const T = 2.4;
  const rows: FolioImg[][] = [];
  let row: FolioImg[] = [];
  let s = 0;
  for (const im of imgs) {
    row.push(im);
    s += clampR(im);
    if (s >= T) {
      rows.push(row);
      row = [];
      s = 0;
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

function FolioBlock({ f }: { f: Folio }) {
  const rows = buildRows(f.preview.slice(0, 5));
  const kicker = f.cat.toLowerCase().includes("archive")
    ? "From the archive"
    : "On the shoot";

  return (
    <section className="folio">
      <div className="fo-head">
        <span className="n">{f.n}</span>
        <h2>
          <Link href={`/editorial/${f.handle}`}>
            {f.brand} {f.season && <em>— {f.season}</em>}
          </Link>
        </h2>
        {f.credits.length > 0 && (
          <div className="cr">
            {f.credits.map((c) => (
              <span key={c[0]}>
                {c[0]} <b>{c[1]}</b>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="fo-body">
        {rows.length === 0 ? (
          <div className="fo-row">
            <div className="fo-txt" style={{ flex: 1 }}>
              <span className="k">{kicker}</span>
              <p>{f.note}</p>
              <Link className="rd" href={`/editorial/${f.handle}`}>
                Open story →
              </Link>
            </div>
          </div>
        ) : (
          rows.map((row, ri) => {
            const isLast = ri === rows.length - 1;
            return (
              <div className="fo-row" key={ri}>
                {row.map((im) => (
                  <Link
                    className="cell"
                    key={im.url}
                    href={`/editorial/${f.handle}`}
                    style={{ flex: clampR(im) }}
                  >
                    <span
                      className="fr"
                      style={{
                        aspectRatio: im.w && im.h ? `${im.w}/${im.h}` : "1",
                      }}
                    >
                      <Image
                        src={im.url}
                        alt={im.altText || f.brand}
                        fill
                        sizes="(min-width: 820px) 40vw, 100vw"
                        style={{ objectFit: "cover" }}
                      />
                    </span>
                    <span className="cap">
                      <span className="t">{im.altText || f.brand}</span>
                      {arLabel(im) && <span className="f">{arLabel(im)}</span>}
                    </span>
                  </Link>
                ))}
                {isLast && (
                  <div className="fo-txt" style={{ flex: 0.9 }}>
                    <span className="k">{kicker}</span>
                    <p>{f.note}</p>
                    <Link className="rd" href={`/editorial/${f.handle}`}>
                      See all {f.photos} photos →
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export function EditorialIndex({
  folios,
  totalPhotos,
}: {
  folios: Folio[];
  totalPhotos: number;
}) {
  const [view, setView] = useState<"gallery" | "index">("gallery");

  useEffect(() => {
    const v = localStorage.getItem("agmnt-editorial-view");
    if (v === "index" || v === "gallery") setView(v);
  }, []);
  useEffect(() => {
    localStorage.setItem("agmnt-editorial-view", view);
  }, [view]);

  return (
    <div className="agmnt-editorial">
      <div className="vbar">
        <span className="lbl">
          {folios.length} Editorial{folios.length === 1 ? "" : "s"}
        </span>
        <span className="cnt">{totalPhotos} photos · mixed formats</span>
        <div className="sw">
          <button
            className={view === "gallery" ? "on" : ""}
            onClick={() => setView("gallery")}
          >
            Gallery
          </button>
          <button
            className={view === "index" ? "on" : ""}
            onClick={() => setView("index")}
          >
            Index
          </button>
        </div>
      </div>

      {folios.length === 0 ? (
        <div style={{ padding: "44px 30px", color: "#8a8a85", fontSize: 14 }}>
          No campaigns yet — add a post to the Editorial blog on Shopify (title,
          category, credits, and a Gallery of photos) and it will appear here.
        </div>
      ) : view === "gallery" ? (
        folios.map((f) => <FolioBlock f={f} key={f.n} />)
      ) : (
        <div className="idx">
          <div className="ixh">
            <span />
            <span>Category</span>
            <span>Story</span>
            <span>Photography</span>
            <span>Location</span>
            <span>Photos</span>
          </div>
          {folios.map((f) => (
            <Link className="ix" href={`/editorial/${f.handle}`} key={f.n}>
              <span className="n">{f.n}</span>
              <span className="c">{f.cat}</span>
              <span className="t">
                {f.brand}
                {f.season ? ` — ${f.season}` : ""}
              </span>
              <span className="ph2">
                {f.credits.find((c) => c[0] === "Photography")?.[1] || "—"}
              </span>
              <span className="loc">
                {f.credits.find((c) => c[0] === "Location")?.[1] || ""}
              </span>
              <span className="fmt">{f.photos} photos</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
