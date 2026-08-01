"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";

export type WeekItem = {
  cat: string;
  date: string;
  readTime: string;
  title: string;
  dek: string;
  by: string;
  imageUrl: string | null;
  imageAlt: string;
  href: string;
};

/**
 * 01 / This week — one rotating queue of Installations articles. Big stage
 * (4:3, crossfade) + detail panel + a thumbnail rail. Auto-advances every 14s
 * with a progress bar; pauses while the visitor hovers the stage. Arrows and
 * the rail switch items manually. Metrics match the v6 reference exactly.
 */
export function WeekFeed({ items }: { items: WeekItem[] }) {
  const n = items.length;
  const [i, setI] = useState(0);
  const [pct, setPct] = useState(0);
  const [hold, setHold] = useState(false);
  const DUR = 14000;

  useEffect(() => {
    if (n <= 1 || hold) return;
    const t0 = Date.now() - (pct / 100) * DUR;
    const id = setInterval(() => {
      const p = ((Date.now() - t0) / DUR) * 100;
      if (p >= 100) {
        setPct(0);
        setI((v) => (v + 1) % n);
      } else {
        setPct(p);
      }
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold, i, n]);

  if (n === 0) return null;

  const go = (x: number) => {
    setPct(0);
    setI((x + n) % n);
  };
  const it = items[i]!;
  const pad = (x: number) => String(x + 1).padStart(2, "0");

  return (
    <section
      className="feed"
      style={{ "--qn": Math.min(n, 7) } as CSSProperties}
    >
      <div className="feed-stage">
        <div
          className="stage"
          onMouseEnter={() => setHold(true)}
          onMouseLeave={() => setHold(false)}
        >
          {items.map((x, k) => (
            <div
              className={`stage-l ${k === i ? "on" : ""}`}
              key={x.href}
              aria-hidden={k !== i}
            >
              {x.imageUrl && (
                <Image
                  src={x.imageUrl}
                  alt={x.imageAlt}
                  fill
                  sizes="(min-width: 1180px) 57vw, 100vw"
                  style={{ objectFit: "cover" }}
                  priority={k === 0}
                />
              )}
            </div>
          ))}
          <span className="stage-tag">
            {it.cat} — {pad(i)} / {String(n).padStart(2, "0")}
          </span>
          <div className="stage-nav">
            <button aria-label="Previous" onClick={() => go(i - 1)}>
              ←
            </button>
            <button aria-label="Next" onClick={() => go(i + 1)}>
              →
            </button>
          </div>
          {n > 1 && !hold && (
            <div className="stage-prog" style={{ width: `${pct}%` }} />
          )}
        </div>

        <div className="feed-txt">
          <div className="feed-kick">
            <span className="c">{it.cat}</span>
            <span>·</span>
            <span>{it.date}</span>
            {it.readTime && (
              <>
                <span>·</span>
                <span>{it.readTime}</span>
              </>
            )}
          </div>
          <h1>
            <Link href={it.href}>{it.title}</Link>
          </h1>
          {it.dek && <p className="feed-dek">{it.dek}</p>}
          <div className="feed-foot">
            <span className="feed-by">
              {it.by ? (
                <>
                  By <b>{it.by}</b>
                </>
              ) : (
                <span />
              )}
            </span>
            <Link className="feed-link" href={it.href}>
              Read the piece →
            </Link>
          </div>
        </div>
      </div>

      <div className="qrail">
        {items.map((x, k) => (
          <button
            className={`q ${k === i ? "on" : ""}`}
            key={x.href}
            onClick={() => go(k)}
          >
            <span className="qt">
              {x.imageUrl && (
                <Image
                  src={x.imageUrl}
                  alt=""
                  fill
                  sizes="16vw"
                  style={{ objectFit: "cover" }}
                />
              )}
            </span>
            <span className="qk">
              <b>{x.cat}</b>
              <span>{pad(k)}</span>
            </span>
            <h5>{x.title}</h5>
          </button>
        ))}
      </div>
    </section>
  );
}
