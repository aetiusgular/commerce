"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type Img = { url: string; altText: string };

/**
 * Reference product gallery: sticky thumbnail rail + large main stage + a
 * two-up secondary strip on desktop, a natural vertical stack on mobile, and
 * a click-to-zoom lightbox. Wired to the product's real images.
 */
export function ProductGallery({
  images,
  lastPair = false,
}: {
  images: Img[];
  lastPair?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock page scroll and enable Escape-to-close while the lightbox is open.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  if (images.length === 0) return <div className="gallery2" />;

  const total = images.length;
  const pad = (n: number) => String(n + 1).padStart(2, "0");

  return (
    <div className="gallery2">
      {/* thumbnail rail */}
      <div className="thumbs">
        {images.map((im, i) => (
          <button
            key={im.url}
            className={`thumb ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
          >
            <Image src={im.url} alt="" fill sizes="64px" />
            <span className="n">{pad(i)}</span>
          </button>
        ))}
      </div>

      <div className="stage">
        {/* main */}
        <div className="stage-main" onClick={() => setLightbox(active)}>
          {lastPair && <span className="stage-tag">Last pair</span>}
          <Image
            src={images[active]!.url}
            alt={images[active]!.altText || ""}
            fill
            sizes="(min-width: 1100px) 55vw, 100vw"
            priority
          />
          <span className="stage-count">
            {pad(active)} / {String(total).padStart(2, "0")}
          </span>
          <button
            className="stage-zoom"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(active);
            }}
          >
            ⊕ Zoom
          </button>
        </div>

        {/* mobile stacked */}
        <div className="stage-track">
          {images.map((im, i) => (
            <div
              className="stage-slide"
              key={`m-${im.url}`}
              onClick={() => setLightbox(i)}
            >
              {lastPair && i === 0 && (
                <span className="stage-tag">Last pair</span>
              )}
              <Image src={im.url} alt={im.altText || ""} fill sizes="100vw" />
            </div>
          ))}
        </div>
      </div>

      {/* Rendered in a portal on <body> so no ancestor stacking context can
          trap it beneath the navbar — otherwise the close button isn't
          clickable. */}
      {mounted &&
        lightbox !== null &&
        createPortal(
          <div
            className="agmnt-pdp"
            style={{ background: "transparent" }}
            onClick={() => setLightbox(null)}
          >
            <div className="lightbox">
              <button
                type="button"
                className="lb-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(null);
                }}
              >
                Close ✕
              </button>
              {total > 1 && (
                <button
                  type="button"
                  className="lb-nav prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((lightbox - 1 + total) % total);
                  }}
                >
                  ‹
                </button>
              )}
              <div className="lb-img" onClick={(e) => e.stopPropagation()}>
                <Image
                  src={images[lightbox]!.url}
                  alt={images[lightbox]!.altText || ""}
                  fill
                  sizes="90vw"
                />
              </div>
              {total > 1 && (
                <button
                  type="button"
                  className="lb-nav next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((lightbox + 1) % total);
                  }}
                >
                  ›
                </button>
              )}
              <div className="lb-count">
                {pad(lightbox)} / {String(total).padStart(2, "0")}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
