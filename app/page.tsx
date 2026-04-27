import { Dispatch } from "components/home/dispatch";
import { HeroOverlay } from "components/home/hero-overlay";
import { ShopSection } from "components/home/shop-section";
import VideoBackground from "components/home/video-background";
import Footer from "components/layout/footer";
import { getShopMetafield } from "lib/shopify";
import Script from "next/script";
import { Suspense } from "react";

export const revalidate = 3600;

export default async function Page() {
  const videoUrl = await getShopMetafield("custom", "homepage_video");

  return (
    <main className="flex flex-col w-full">
      {/* Pull the SoundCloud Widget API in parallel with hydration so the
          radio component finds it already loaded when its useEffect runs. */}
      <Script
        src="https://w.soundcloud.com/player/api.js"
        strategy="afterInteractive"
      />
      {/* ➀ Hero — Spring/Summer 2026 video campaign */}
      <section
        id="campaign"
        className="relative w-full h-screen overflow-hidden bg-black"
      >
        {videoUrl && <VideoBackground videoUrl={videoUrl} />}
        <HeroOverlay />
      </section>

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
    </main>
  );
}
