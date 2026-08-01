import {
  EditorialIndex,
  type Folio,
} from "components/editorial/editorial-index";
import { getArticle, getEditorials } from "lib/shopify";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial",
  description:
    "AGMNT editorial — campaign photography, lookbooks and archive stories.",
  alternates: { canonical: "/editorial" },
};

export default async function EditorialIndexPage() {
  // Listing gives us the campaign handles; fetch each full article for its
  // gallery so the index can show a real preview strip.
  const eds = await getEditorials();
  const full = (await Promise.all(eds.map((e) => getArticle(e.handle)))).filter(
    (a): a is NonNullable<typeof a> => Boolean(a),
  );

  const folios: Folio[] = full.map((a, i) => {
    const credits: [string, string][] = [
      ...(a.photography
        ? ([["Photography", a.photography]] as [string, string][])
        : []),
      ...(a.styling ? ([["Styling", a.styling]] as [string, string][]) : []),
      ...(a.location ? ([["Location", a.location]] as [string, string][]) : []),
    ];
    const src = a.gallery.length ? a.gallery : a.image ? [a.image] : [];
    return {
      n: String(i + 1).padStart(2, "0"),
      handle: a.handle,
      brand: a.title,
      season: a.season || "",
      cat: a.category || "Editorial",
      credits,
      note: a.excerpt || "",
      photos: (a.image ? 1 : 0) + a.gallery.length,
      preview: src.slice(0, 5).map((im) => ({
        url: im.url,
        altText: im.altText || "",
        w: im.width,
        h: im.height,
      })),
    };
  });

  const totalPhotos = folios.reduce((s, f) => s + f.photos, 0);

  return <EditorialIndex folios={folios} totalPhotos={totalPhotos} />;
}
