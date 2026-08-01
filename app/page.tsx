import { Dispatch } from "components/home/dispatch";
import { Preloader } from "components/home/preloader";
import { ShopSection } from "components/home/shop-section";
import { ThisWeek } from "components/home/this-week";
import Footer from "components/layout/footer";
import Script from "next/script";
import { Suspense } from "react";

export const revalidate = 3600;

export default async function Page() {
  return (
    <>
      {/* Brand preloader — masks first-load latency, runs once per session. */}
      <Preloader />

      {/* Pull the SoundCloud Widget API in parallel with hydration so the
          radio component finds it already loaded when its useEffect runs. */}
      <Script
        src="https://w.soundcloud.com/player/api.js"
        strategy="afterInteractive"
      />

      {/* 01 — This week (Installations) */}
      <Suspense fallback={null}>
        <ThisWeek />
      </Suspense>

      {/* 02 — Shop */}
      <Suspense fallback={null}>
        <ShopSection />
      </Suspense>

      {/* 03 — Editorial (campaigns) + Radio */}
      <Suspense fallback={null}>
        <Dispatch />
      </Suspense>

      <Footer />
    </>
  );
}
