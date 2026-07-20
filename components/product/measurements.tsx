import type { ShopifyMetafield } from "lib/shopify/types";
import { Cookie } from "./cookie";

type Row = { label: string; value: string };

/**
 * Parses the `custom.measurements` product metafield.
 *
 * Supports two shapes so the metafield can be authored either way in Shopify:
 *  1. JSON object — {"Chest": "56 cm", "Shoulder": "46 cm"}
 *  2. Plain text  — one "Label: value" pair per line
 *
 * Returns null when there is nothing renderable, so the caller can omit the
 * whole section rather than render an empty header.
 */
function parseMeasurements(metafield: ShopifyMetafield): Row[] | null {
  const raw = metafield?.value?.trim();
  if (!raw) return null;

  // 1. JSON object of label -> value
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const rows = Object.entries(parsed)
        .filter(([, value]) => value !== null && value !== "")
        .map(([label, value]) => ({ label, value: String(value) }));
      if (rows.length) return rows;
    }
  } catch {
    // Not JSON — fall through to the plain-text parser.
  }

  // 2. Plain text, one "Label: value" per line
  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return { label: line, value: "" };
      return {
        label: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
      };
    })
    .filter((row) => row.label);

  return rows.length ? rows : null;
}

export function Measurements({
  metafield,
  index = 3,
}: {
  metafield: ShopifyMetafield;
  index?: number;
}) {
  const rows = parseMeasurements(metafield);
  if (!rows) return null;

  return (
    <div className="flex flex-col" data-testid="measurements">
      <Cookie index={index} text="Measurements" />
      <dl className="font-vremena mt-1 flex flex-col gap-y-1 pb-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between border-b border-black/10 py-1 last:border-b-0"
          >
            <dt className="text-black/60">{row.label}</dt>
            <dd className="text-black">{row.value}</dd>
          </div>
        ))}
      </dl>
      <span className="font-vremena text-xs text-black/40">
        Measured flat, in centimetres. Allow 1–2 cm variance.
      </span>
    </div>
  );
}
