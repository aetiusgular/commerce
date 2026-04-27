import { Dispatch } from "components/home/dispatch";
import { Preloader } from "components/home/preloader";
import { ShopSection } from "components/home/shop-section";
import Footer from "components/layout/footer";
import { getShopMetafield } from "lib/shopify";
import Script from "next/script";
import { Suspense } from "react";

export const revalidate = 3600;

export default async function Page() {
  // Re-fetched here (cached, near-free) so we can emit a preload hint on first
  // page load. The actual <video> element lives in <PersistentHero> in the
  // root layout — this just kicks off the byte fetch during initial HTML
  // parse so the file is already in cache when the hero mounts.
  const videoUrl = await getShopMetafield("custom", "homepage_video");

  return (
    <>
      {/* ➀ Brand preloader — masks first-load latency, runs once per session. */}
      <Preloader />

      {videoUrl && <link rel="preload" as="video" href={videoUrl} />}

      {/* Pull the SoundCloud Widget API in parallel with hydration so the
          radio component finds it already loaded when its useEffect runs. */}
      <Script
        src="https://w.soundcloud.com/player/api.js"
        strategy="afterInteractive"
      />

      {/* ➁ Shop */}
      <Suspense fallback={null}>
        <ShopSection />
      </Suspense>

      {/* ➂ Dispatch (Editorial + Radio) */}
      <Suspense fallback={null}>
        <Dispatch />
      </Suspense>

      {/* ➃ Lookbook
      <Suspense fallback={null}>
        <Lookbook />
      </Suspense>
      */}

      <Footer />
    </>
  );
}
