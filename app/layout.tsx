import { MetaPixel } from "components/analytics/meta-pixel";
import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { SaleBanner } from "components/layout/sale-banner";
import { getCart, getSaleBanner, getShopMetafield } from "lib/shopify";
import { baseUrl } from "lib/utils";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const vremena = localFont({
  src: "../fonts/vremenagroteskbook.otf",
  variable: "--font-vremena",
});

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    follow: true,
    index: true,
  },
};

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = getCart();
  // Hero video URL is fetched at the layout level so the <video> element can
  // be rendered persistently across all routes (LaCrapule pattern). The
  // function is cached via cacheLife("hours") so this is near-free.
  const videoUrl = await getShopMetafield("custom", "homepage_video");
  const videoOrigin = videoUrl ? safeOrigin(videoUrl) : null;

  // Sale banner copy lives in Shopify shop metafields — see getSaleBanner().
  const saleBanner = await getSaleBanner();

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AGMNT",
    alternateName: ["Augment", "AGMNT Store"],
    url: baseUrl,
    logo: `${baseUrl}/images/AGMNT-logo-black.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Los Angeles",
      addressRegion: "CA",
      addressCountry: "US",
    },
    sameAs: [
      process.env.NEXT_PUBLIC_WIKIDATA_URL,
      "https://www.instagram.com/agmnt_store/",
      "https://www.facebook.com/p/AGMNT-Store-61567711654132/",
      "https://www.linkedin.com/company/agmnt-store",
    ].filter(Boolean),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AGMNT",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={vremena.variable}>
      <head>
        {/* Warm DNS+TLS for the SoundCloud radio iframe + widget API so the
            handshake doesn't block first-paint of the radio section. */}
        <link rel="preconnect" href="https://w.soundcloud.com" />
        <link rel="preconnect" href="https://api.soundcloud.com" />
        <link rel="dns-prefetch" href="https://i1.sndcdn.com" />
        {/* Open the connection to Supabase storage early so the hero video
            handshake is already done when <PersistentHero> mounts. */}
        {videoOrigin && <link rel="preconnect" href={videoOrigin} />}

        {/* Entity markup — declares AGMNT as an Organization (pronounced
            "augment") and links its scattered identities so Google merges them
            into one entity and separates it from agmnt.com / agmnt.app. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-white text-black selection:bg-pink-500 dark:bg-white dark:text-black dark:selection:bg-teal-300 dark:selection:text-black"
      >
        <MetaPixel />
        <CartProvider cartPromise={cart}>
          <SaleBanner banner={saleBanner} />
          <Navbar />
          <main>
            {children}
            <Toaster closeButton />
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
