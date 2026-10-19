import { categoriesOf, colorOf } from "lib/shop-facets";
import type { Product } from "lib/shopify/types";

/**
 * Client-side product search for the search overlay.
 *
 * Every word in the query has to match something on the listing: brand,
 * title, type, category, colour, option values, tags or description. Results
 * rank by where the words hit (a brand hit beats a description hit). When
 * nothing matches every word, the closest spellings are used instead, so
 * "xlm" still finds XLIM and "blck" finds black pieces.
 */

/** Lowercase, strip accents and fold ligatures (ÆSYNCTX -> aesynctx). */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

const tokenize = (s: string) =>
  normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const COLOR_OPTION = /^colou?r$/i;

type Field = { weight: number; tokens: string[]; text: string };
export type IndexedProduct = { product: Product; fields: Field[] };

const field = (weight: number, parts: (string | undefined | null)[]) => {
  const text = parts.filter(Boolean).join(" ");
  return { weight, tokens: tokenize(text), text: normalize(text) };
};

export function indexProducts(products: Product[]): IndexedProduct[] {
  return products.map((p) => {
    const colors = [
      ...colorOf(p),
      ...(p.options ?? [])
        .filter((o) => COLOR_OPTION.test(o.name))
        .flatMap((o) => o.values),
    ];
    const otherOptions = (p.options ?? [])
      .filter((o) => !COLOR_OPTION.test(o.name))
      .flatMap((o) => o.values);
    return {
      product: p,
      fields: [
        field(10, [p.vendor]),
        field(6, [p.title]),
        field(5, [p.productType, ...categoriesOf(p)]),
        field(5, colors),
        field(3, p.tags ?? []),
        field(2, otherOptions),
        field(1, [p.description]),
      ],
    };
  });
}

/** How well one query word hits one field: exact word > word prefix > inside. */
function wordScore(word: string, f: Field): number {
  if (f.tokens.includes(word)) return f.weight;
  if (word.length >= 2 && f.tokens.some((t) => t.startsWith(word)))
    return f.weight * 0.7;
  if (word.length >= 3 && f.text.includes(word)) return f.weight * 0.4;
  return 0;
}

function scoreProduct(words: string[], ip: IndexedProduct, all: boolean) {
  let total = 0;
  let hits = 0;
  for (const w of words) {
    let best = 0;
    for (const f of ip.fields) best = Math.max(best, wordScore(w, f));
    if (best > 0) hits++;
    else if (all) return 0;
    total += best;
  }
  // Whole phrase in the title or brand ("curved zip") is worth a bonus.
  const phrase = words.join(" ");
  if (
    words.length > 1 &&
    (ip.fields[0]!.text + " " + ip.fields[1]!.text).includes(phrase)
  )
    total += 5;
  return hits ? total + hits * 100 : 0;
}

/** Edit distance with an early exit once it passes `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

const allowedTypos = (w: string) => (w.length <= 3 ? 1 : w.length <= 6 ? 2 : 3);

/** Closest word in the catalogue to `word`, or null if nothing is near. */
function closestWord(word: string, vocab: Set<string>): string | null {
  const max = allowedTypos(word);
  let best: string | null = null;
  let bestD = max + 1;
  for (const v of vocab) {
    // Compare against the start of longer words too ("xli" ~ "xlim").
    const d = Math.min(
      editDistance(word, v, max),
      v.length > word.length
        ? editDistance(word, v.slice(0, word.length), max)
        : max + 1,
    );
    if (d < bestD || (d === bestD && best && v.length < best.length)) {
      best = v;
      bestD = d;
    }
  }
  return best;
}

export type SearchResult = {
  products: Product[];
  /** Set when no exact match was found and the query was corrected. */
  correctedTo: string | null;
};

export function searchProducts(
  index: IndexedProduct[],
  query: string,
): SearchResult {
  const words = tokenize(query);
  if (!words.length)
    return { products: index.map((ip) => ip.product), correctedTo: null };

  const rank = (ws: string[], all: boolean) =>
    index
      .map((ip, i) => ({ p: ip.product, s: scoreProduct(ws, ip, all), i }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((r) => r.p);

  const exact = rank(words, true);
  if (exact.length) return { products: exact, correctedTo: null };

  // No listing has every word: fix spellings against the catalogue, then
  // rank anything that matches any of the corrected words.
  const vocab = new Set<string>();
  for (const ip of index)
    for (const f of ip.fields.slice(0, 5))
      for (const t of f.tokens) if (t.length > 1) vocab.add(t);
  const fixed = words.map((w) => closestWord(w, vocab) ?? w);
  const corrected = fixed.join(" ");
  const strict = rank(fixed, true);
  const products = strict.length ? strict : rank(fixed, false);
  return {
    products,
    correctedTo:
      products.length && corrected !== words.join(" ") ? corrected : null,
  };
}
