"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { trackAddToCart } from "lib/analytics";
import type { Product, ProductVariant } from "lib/shopify/types";
import { colorHex, discountPercent, isOnSale, parseKeyValues } from "lib/utils";
import { useMemo, useRef, useState } from "react";

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

export function ProductPanel({ product }: { product: Product }) {
  const { addCartItem } = useCart();
  const formRef = useRef<HTMLFormElement>(null);

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

  const addToBag = () => {
    if (!canAdd || !variant) return;
    addCartItem(variant, product);
    trackAddToCart({
      id: variant.id,
      title: product.title,
      value: parseFloat(variant.price.amount),
      currency: variant.price.currencyCode,
    });
    formRef.current?.requestSubmit();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

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

        {/* Add to bag + wishlist. The form runs the server mutation; the
            optimistic cart update happens in addToBag's onClick. */}
        <form
          ref={formRef}
          action={async () => {
            await addItem(null, variant?.id);
          }}
        >
          <div className="buy">
            <button
              type="button"
              className={`atc ${added ? "added" : ""} ${canAdd ? "" : "disabled"}`}
              onClick={addToBag}
              disabled={!canAdd}
            >
              {added
                ? "✓ Added to bag"
                : needsSize
                  ? "Select a size"
                  : variant?.availableForSale
                    ? "Add to bag"
                    : "Sold out"}
            </button>
          </div>
        </form>

        <div className="assist">
          <span>Complimentary shipping</span>
          <span>30-day returns</span>
        </div>

        {/* Accordions */}
        <div className="accs">
          <Acc
            label="Description"
            open={accs.desc}
            onToggle={() => toggle("desc")}
          >
            {product.descriptionHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            ) : product.description ? (
              <p className="lead">{product.description}</p>
            ) : (
              <p className="lead" style={{ opacity: 0.5 }}>
                No description available.
              </p>
            )}
            {details && (
              <dl className="spec">
                {details.map((r) => (
                  <div className="spec-row" key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
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
                    <table className="measure">
                      <thead>
                        <tr>
                          {sizeFitData.columns.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sizeFitData.rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
