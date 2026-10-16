"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { trackAddToCart } from "lib/analytics";
import type { Product, ProductVariant } from "lib/shopify/types";
import { colorHex, discountPercent, isOnSale, parseKeyValues } from "lib/utils";
import { useMemo, useState, useTransition } from "react";

const lc = (s: string) => s.trim().toLowerCase();

function stock(variant: ProductVariant | undefined) {
  if (!variant || !variant.availableForSale)
    return { cls: "soldout", txt: "Sold out" };
  const q = variant.quantityAvailable ?? undefined;
  if (typeof q === "number" && q > 0 && q <= 3)
    return { cls: "low", txt: `Only ${q} left` };
  return { cls: "in", txt: "In stock" };
}

/** Accordion section — renders nothing when it has no children. */
function Acc({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`acc ${open ? "open" : ""}`}>
      <button className="acc-head" onClick={onToggle}>
        <span className="acc-cookie">
          <span className="lab">{label}</span>
        </span>
        <span className="acc-sign" aria-hidden="true" />
      </button>
      <div className="acc-body">
        <div className="acc-inner">{children}</div>
      </div>
    </div>
  );
}

/** Structured Size & Fit content parsed from the custom.size_fit metafield. */
type SizeFitData = {
  fit?: string | number;
  note?: string;
  columns?: string[];
  rows?: string[][];
  guide?: string;
};
function parseSizeFit(raw: string | null | undefined): SizeFitData | null {
  const text = raw?.trim();
  if (!text) return null;
  try {
    const p = JSON.parse(text);
    if (p && typeof p === "object" && !Array.isArray(p))
      return p as SizeFitData;
  } catch {
    // not JSON — caller falls back to raw HTML/text
  }
  return null;
}
const fitPercent = (fit: string | number | undefined): number => {
  if (typeof fit === "number") return Math.max(0, Math.min(100, fit));
  const map: Record<string, number> = { snug: 8, true: 50, oversized: 90 };
  return map[String(fit ?? "true").toLowerCase()] ?? 50;
};

/**
 * Splits our product description HTML into a lead sentence and a list of
 * detail bullets, dropping the legacy "Item Info:" heading. Regex-based so it
 * behaves identically on the server and the client (no DOM needed).
 */
function splitDescription(html: string): { lead: string; bullets: string[] } {
  if (!html) return { lead: "", bullets: [] };
  // Drop the legacy "Item Info:" heading paragraph.
  let h = html.replace(
    /<p[^>]*>(?:\s|<[^>]+>)*Item\s*Info:(?:\s|<\/[^>]+>)*<\/p>/i,
    "",
  );
  // Collect bullet text, then strip the list so it isn't repeated in the lead.
  const bullets: string[] = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = liRe.exec(h)) !== null) {
    const text = (m[1] ?? "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) bullets.push(text);
  }
  h = h.replace(/<ul[\s\S]*?<\/ul>/gi, "").replace(/<ol[\s\S]*?<\/ol>/gi, "");
  const lead = h
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { lead, bullets };
}

/**
 * Converts one measurement cell to the chosen unit. Non-numeric cells (size
 * labels, blanks) pass through untouched; inches round to the nearest half.
 */
function convertMeasure(cell: string, unit: "cm" | "in"): string {
  if (unit === "cm") return cell;
  const n = parseFloat(cell);
  if (!cell || Number.isNaN(n)) return cell;
  const inches = Math.round((n / 2.54) * 2) / 2;
  return Number.isInteger(inches) ? String(inches) : inches.toFixed(1);
}

/** Labels in `custom.details` that describe what the garment is made of. */
const COMPOSITION_LABEL =
  /^(materials?|fabric|shell|body|lining|accent|contrast|insulation|padding|fill|panels?|trim)\b/i;

type Fiber = { pct: string; name: string };
type CompositionPart = { label: string; fibers: Fiber[]; text: string };

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Reads "97% polyester, 3% spandex" (or "Polyester 97% / Spandex 3%") into
 * fibre lines. Returns [] when the value carries no percentages, in which case
 * the caller prints the text as written (e.g. "3M Featherless Down").
 */
function parseFibers(value: string): Fiber[] {
  const out: Fiber[] = [];
  const pctFirst = /(\d+(?:\.\d+)?)\s*%\s*([^,;/%\d]+)/g;
  let m: RegExpExecArray | null;
  while ((m = pctFirst.exec(value)) !== null) {
    const name = (m[2] ?? "").replace(/\band\b\s*$/i, "").trim();
    if (name) out.push({ pct: `${m[1]}%`, name: capitalize(name) });
  }
  if (out.length) return out;
  const nameFirst = /([A-Za-z][A-Za-z\s-]*?)\s+(\d+(?:\.\d+)?)\s*%/g;
  while ((m = nameFirst.exec(value)) !== null) {
    const name = (m[1] ?? "").replace(/^and\s+/i, "").trim();
    if (name) out.push({ pct: `${m[2]}%`, name: capitalize(name) });
  }
  return out;
}

/**
 * Splits the `custom.details` rows into garment composition parts and any
 * other facts (Season, Made in…). Every part is optional, so a product with
 * one fabric, no lining, or four different fabrics all render from the same
 * rows. Repeated labels ("Accent" twice) are numbered.
 */
function splitDetails(rows: { label: string; value: string }[] | null): {
  composition: CompositionPart[];
  info: { label: string; value: string }[];
} {
  const composition: CompositionPart[] = [];
  const info: { label: string; value: string }[] = [];
  for (const r of rows ?? []) {
    if (!r.value) continue;
    if (COMPOSITION_LABEL.test(r.label))
      composition.push({
        label: r.label,
        fibers: parseFibers(r.value),
        text: r.value,
      });
    else info.push(r);
  }
  // "Material" reads as the outer fabric once other parts are listed.
  if (composition.length > 1)
    for (const c of composition)
      if (/^(materials?|fabric|body)$/i.test(c.label)) c.label = "Shell";
  const totals: Record<string, number> = {};
  for (const c of composition)
    totals[lc(c.label)] = (totals[lc(c.label)] ?? 0) + 1;
  const seen: Record<string, number> = {};
  for (const c of composition) {
    const k = lc(c.label);
    if ((totals[k] ?? 0) > 1) {
      seen[k] = (seen[k] ?? 0) + 1;
      c.label = `${c.label} ${seen[k]}`;
    }
  }
  return { composition, info };
}

export function ProductPanel({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const [, startAdd] = useTransition();

  const colorOption = product.options.find(
    (o) => lc(o.name) === "color" || lc(o.name) === "colour",
  );
  const sizeOption = product.options.find(
    (o) => lc(o.name) === "size" || lc(o.name) === "sizes",
  );

  const [color, setColor] = useState(colorOption?.values[0] ?? "");
  const [size, setSize] = useState("");
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [accs, setAccs] = useState({
    desc: true,
    meas: false,
    fit: false,
    care: false,
  });
  const toggle = (k: keyof typeof accs) =>
    setAccs((p) => ({ ...p, [k]: !p[k] }));

  // Resolve the variant from the currently selected options.
  const selected: Record<string, string> = {};
  if (colorOption) selected[lc(colorOption.name)] = color;
  if (sizeOption) selected[lc(sizeOption.name)] = size;

  const variant = useMemo(() => {
    if (product.variants.length === 1) return product.variants[0];
    return product.variants.find((v) =>
      v.selectedOptions.every((o) => selected[lc(o.name)] === o.value),
    );
  }, [product.variants, color, size]); // eslint-disable-line react-hooks/exhaustive-deps

  const variantForSize = (sizeValue: string) =>
    product.variants.find((v) =>
      v.selectedOptions.every((o) => {
        if (lc(o.name) === lc(sizeOption?.name ?? ""))
          return o.value === sizeValue;
        if (colorOption && lc(o.name) === lc(colorOption.name))
          return o.value === color;
        return true;
      }),
    );

  const needsSize = Boolean(sizeOption) && !size;
  const canAdd = Boolean(variant?.availableForSale) && !needsSize;

  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice ?? null;
  const onSale = isOnSale(compareAt, price);
  const percentOff = discountPercent(compareAt, price);

  const details = parseKeyValues(product.details?.value);
  const measurements = parseKeyValues(product.measurements?.value);
  const materials = parseKeyValues(product.materials?.value);
  const sizeFit = product.sizeFit?.value?.trim();
  const sizeFitData = parseSizeFit(product.sizeFit?.value);
  // When Size & Fit isn't structured JSON, treat it as plain "Label: value"
  // lines so it renders as a clean list without anyone writing JSON.
  const sizeFitRows = sizeFitData
    ? null
    : parseKeyValues(product.sizeFit?.value);

  // Description: one numbered Details list (the lead sentence is item 01) and
  // a Composition table. When composition comes from `custom.details`, drop
  // the material bullet (anything with a percentage) so it isn't listed twice.
  const desc = splitDescription(product.descriptionHtml ?? "");
  const { composition, info } = splitDetails(details);
  const leadText = (
    desc.lead ||
    (desc.bullets.length ? "" : product.description) ||
    ""
  ).trim();
  const detailItems = [
    ...(leadText ? [leadText] : []),
    ...(composition.length
      ? desc.bullets.filter((b) => !/\d\s*%/.test(b))
      : desc.bullets),
  ];
  const hasDescription =
    detailItems.length > 0 || composition.length > 0 || info.length > 0;

  return (
    <div className="info2">
      <div className="info-sticky">
        {product.vendor && <div className="pbrand">{product.vendor}</div>}
        <h1 className="ptitle">{product.title}</h1>

        {colorOption && (
          <>
            <div className="pcolor">
              Colour — <b>{color}</b>
            </div>
            <div className="swatches">
              {colorOption.values.map((c) => (
                <button
                  key={c}
                  className={`swatch ${c === color ? "active" : ""}`}
                  style={{ background: colorHex(c) }}
                  aria-label={c}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </>
        )}

        <div className="rule" />

        <div className="price-row">
          {onSale && compareAt ? (
            <div className="price">
              <span className="was">
                {parseFloat(compareAt.amount).toFixed(2)}
              </span>
              <span className="now">{parseFloat(price.amount).toFixed(2)}</span>
              <span className="ccy">
                {price.currencyCode} · −{percentOff}%
              </span>
            </div>
          ) : (
            <div className="price">
              {parseFloat(price.amount).toFixed(2)}
              <span className="ccy">{price.currencyCode}</span>
            </div>
          )}
        </div>
        <div className="rule" />

        {/* Size selector */}
        {sizeOption && (
          <>
            <div className="field-head">
              <span className="field-label">Select size</span>
              {sizeFit && (
                <button
                  className="size-guide-btn"
                  onClick={() => setAccs((p) => ({ ...p, fit: true }))}
                >
                  Size guide
                </button>
              )}
            </div>

            <div className={`select-wrap ${open ? "open" : ""}`}>
              <button
                className={`select-btn ${size ? "" : "placeholder"}`}
                onClick={() => setOpen((o) => !o)}
              >
                <span>{size ? `Size ${size}` : "Select a size"}</span>
                <span className="chev" aria-hidden="true" />
              </button>
              {open && (
                <div className="select-menu">
                  {sizeOption.values.map((s) => {
                    const st = stock(variantForSize(s));
                    const sold = st.cls === "soldout";
                    return (
                      <button
                        key={s}
                        className={`select-opt ${sold ? "soldout" : ""} ${
                          s === size ? "sel" : ""
                        }`}
                        disabled={sold}
                        onClick={() => {
                          if (!sold) {
                            setSize(s);
                            setOpen(false);
                          }
                        }}
                      >
                        <span className="lbl">{s}</span>
                        <span
                          className={`stk ${st.cls === "low" ? "low" : ""}`}
                        >
                          {st.txt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Add to cart. onClick + a transition (rather than a form action,
            which fired unreliably on mobile). The optimistic cart update must
            run inside the transition — React 19 throws otherwise. */}
        <div className="buy">
          <button
            type="button"
            className={`atc ${added ? "added" : ""} ${canAdd ? "" : "disabled"}`}
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd || !variant) return;
              startAdd(async () => {
                addCartItem(variant, product);
                trackAddToCart({
                  id: variant.id,
                  title: product.title,
                  value: parseFloat(variant.price.amount),
                  currency: variant.price.currencyCode,
                });
                await addItem(null, variant.id);
              });
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
          >
            {added
              ? "✓ Added to cart"
              : needsSize
                ? "Select a size"
                : variant?.availableForSale
                  ? "Add to cart"
                  : "Sold out"}
          </button>
        </div>

        <div className="assist">
          <span>14-day returns</span>
          <span>Free US shipping over $250</span>
          <span>Taxes &amp; duties paid by buyer at checkout</span>
        </div>

        {/* Accordions */}
        <div className="accs">
          <Acc
            label="Description"
            open={accs.desc}
            onToggle={() => toggle("desc")}
          >
            {!hasDescription && (
              <p className="lead" style={{ opacity: 0.5 }}>
                No description available.
              </p>
            )}
            {detailItems.length > 0 && (
              <div className="dsec">
                <div className="dsec-h">Details</div>
                <ol className="dlist">
                  {detailItems.map((b, i) => (
                    <li key={i}>
                      <span className="n" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {composition.length > 0 && (
              <div className="dsec">
                <div className="dsec-h">Composition</div>
                <dl className="comp">
                  {composition.map((c) => (
                    <div className="comp-row" key={c.label}>
                      <dt>{c.label}</dt>
                      <dd>
                        {c.fibers.length > 0
                          ? c.fibers.map((f, i) => (
                              <span className="fiber" key={i}>
                                <span className="pct">{f.pct}</span>
                                <span>{f.name}</span>
                              </span>
                            ))
                          : c.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {info.length > 0 && (
              <div className="dsec">
                <div className="dsec-h">Info</div>
                <dl className="comp">
                  {info.map((r) => (
                    <div className="comp-row" key={r.label}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Acc>

          {measurements && (
            <Acc
              label="Measurements"
              open={accs.meas}
              onToggle={() => toggle("meas")}
            >
              <dl className="mtable">
                {measurements.map((r) => (
                  <div className="mrow" key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mnote">
                Measured flat, in centimetres. Allow 1–2 cm variance.
              </div>
            </Acc>
          )}

          {(sizeFitData || sizeFit) && (
            <Acc label="Sizing" open={accs.fit} onToggle={() => toggle("fit")}>
              {sizeFitData ? (
                <>
                  {sizeFitData.fit !== undefined && (
                    <div className="fitbar">
                      <div className="fitbar-label">
                        <span>Snug</span>
                        <span>True to size</span>
                        <span>Oversized</span>
                      </div>
                      <div className="fitbar-track">
                        <span
                          className="fitbar-dot"
                          style={{ left: `${fitPercent(sizeFitData.fit)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {sizeFitData.note && (
                    <p className="fit-note">{sizeFitData.note}</p>
                  )}
                  {sizeFitData.columns && sizeFitData.rows && (
                    <>
                      <div className="measure-bar">
                        <span className="measure-bar-label">Measured flat</span>
                        <div
                          className="unit-toggle"
                          role="group"
                          aria-label="Measurement units"
                        >
                          <button
                            type="button"
                            className={unit === "cm" ? "active" : ""}
                            aria-pressed={unit === "cm"}
                            onClick={() => setUnit("cm")}
                          >
                            cm
                          </button>
                          <button
                            type="button"
                            className={unit === "in" ? "active" : ""}
                            aria-pressed={unit === "in"}
                            onClick={() => setUnit("in")}
                          >
                            in
                          </button>
                        </div>
                      </div>
                      <table className="measure">
                        <thead>
                          <tr>
                            {sizeFitData.columns.map((c, j) => (
                              <th key={c}>
                                {c.replace(/\s*\((?:cm|in)\)\s*$/i, "")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sizeFitData.rows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j}>
                                  {j === 0 ? cell : convertMeasure(cell, unit)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mnote">
                        Allow 1 to 2 {unit === "cm" ? "cm" : "in"} variance.
                      </div>
                    </>
                  )}
                  {sizeFitData.guide && (
                    <a
                      className="size-guide-btn"
                      href={sizeFitData.guide}
                      style={{ display: "inline-block", marginTop: 16 }}
                    >
                      Open full size guide →
                    </a>
                  )}
                </>
              ) : sizeFitRows ? (
                <dl className="spec" style={{ marginTop: 0 }}>
                  {sizeFitRows.map((r) => (
                    <div className="spec-row" key={r.label}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: sizeFit! }} />
              )}
            </Acc>
          )}

          {materials && (
            <Acc
              label="Materials & Care"
              open={accs.care}
              onToggle={() => toggle("care")}
            >
              <dl className="spec" style={{ marginTop: 0 }}>
                {materials.map((r) => (
                  <div className="spec-row" key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </Acc>
          )}
        </div>
      </div>
    </div>
  );
}
