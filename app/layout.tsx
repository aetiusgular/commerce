import { MetaPixel } from "components/analytics/meta-pixel";
import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { PersistentHero } from "components/layout/persistent-hero";
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
      </head>
      <body
        suppressHydrationWarning
        className="bg-white text-black selection:bg-pink-500 dark:bg-white dark:text-black dark:selection:bg-teal-300 dark:selection:text-black"
      >
        <MetaPixel />
        <CartProvider cartPromise={cart}>
          <SaleBanner banner={saleBanner} />
          <Navbar />
          {/* Persistent hero — mounted once on first home visit, kept in DOM
              across navigations so returning to home is flash-free. */}
          <PersistentHero videoUrl={videoUrl} />
          <main>
            {children}
            <Toaster closeButton />
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
