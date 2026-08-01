/**
 * Editorial brand copy for the shop's in-page house header (.bnote). Keyed by
 * the exact Shopify vendor name. When a shopper filters or searches down to a
 * single designer, the shop surfaces this note + facts above the grid. Houses
 * without an entry still get a header built from live catalogue stats.
 */
export type BrandInfo = {
  est?: string;
  city?: string;
  focus?: string;
  note?: string;
};

export const BRANDS: Record<string, BrandInfo> = {
  Auralee: {
    est: "2015",
    city: "Tokyo, Japan",
    focus: "Knitwear · Trousers",
    note: "A Tokyo house built on yarn before silhouette — cashmere spun to order, wool milled soft enough to wear against the skin. Cuts stay quiet and slightly oversized so the material does the talking.",
  },
  "Camiel Fortgens": {
    city: "Amsterdam, Netherlands",
    focus: "Suiting · Knitwear",
    note: "Research-led tailoring that keeps its working notes visible: enlarged proportions, deliberately naive seams, garments that read like a first draft made permanent. Familiar clothes, all of them slightly wrong on purpose.",
  },
  "Kaptain Sunshine": {
    city: "Tokyo, Japan",
    focus: "Outerwear",
    note: "Post-war American workwear and travel clothing redrawn with Japanese patterning. Deck jackets and trenches in dry cottons, sized for layering, finished to last decades rather than seasons.",
  },
  Lemaire: {
    est: "1991",
    city: "Paris, France",
    focus: "Trousers · Bags",
    note: "Paris, and a wardrobe of soft volumes: curved trousers, rounded leathers, everything cut to fall rather than hold. The line reads plain on a hanger and specific on a body.",
  },
  "Margaret Howell": {
    est: "1970",
    city: "London, England",
    focus: "Shirts · Suiting",
    note: "A fifty-year study of English utility clothing — poplin, linen, garment dye, no ornament. Shirting is the centre of the house and the reason to start here.",
  },
  "Our Legacy": {
    est: "2005",
    city: "Stockholm, Sweden",
    focus: "Shirts · Trousers",
    note: "Stockholm-made, borrowed proportions: the shirt cut like someone else's, trousers formal from the waist and loose everywhere below. Fabric research runs ahead of the silhouette.",
  },
  Sefr: {
    city: "Stockholm, Sweden",
    focus: "Footwear · Trousers",
    note: "A small Swedish label working a narrow range — suede loafers, wide wool trousers, little else. Reduced enough that each season reads as a revision rather than a reinvention.",
  },
  "Studio Nicholson": {
    est: "2010",
    city: "London, England",
    focus: "Outerwear · Knitwear",
    note: "A modular wardrobe designed to be bought in parts and worn as a system: fixed proportions, repeated fabrics, coats and knits that resolve against each other season to season.",
  },
  Sunspel: {
    est: "1860",
    city: "Long Melford, England",
    focus: "Knitwear · Shirts",
    note: "An English mill that has spent over a century on one problem — cotton next to the skin. Sea Island jersey, brushed overshirting, weights refined rather than restyled.",
  },
  Toteme: {
    est: "2014",
    city: "Stockholm, Sweden",
    focus: "Accessories · Bags",
    note: "Stockholm minimalism with a strict accessory language: monogram wool, plain leather goods, nothing that dates inside a decade. Made to be the last thing added to an outfit.",
  },
};
