// Section 03 (Editorial + AGMNT Radio) is hidden from the home page for now.
// Re-enable by uncommenting this import, the <Script> tag and the section below.
// import { Dispatch } from "components/home/dispatch";
import { Preloader } from "components/home/preloader";
import { ShopSection } from "components/home/shop-section";
import { ThisWeek } from "components/home/this-week";
import Footer from "components/layout/footer";
// import Script from "next/script";
import type { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "AGMNT | Avant-Garde & Korean Designer Clothing",
  },
  description:
    "AGMNT stocks avant-garde and Korean designer clothing: XLIM, AESYNCTX, Post Archive Faction, Aenrmous, AVAVAV, Kozaburo sashiko denim and 11 by BBS x Salomon. Ships worldwide.",
  alternates: { canonical: "/" },
};

export default async function Page() {
  return (
    <>
      {/* The page's one H1. The featured article headline below is an H2 so
          the homepage reads as the store, not as that article. */}
      <h1 className="sr-only">
        AGMNT: avant-garde, Korean and Japanese designer clothing
      </h1>

      {/* Brand preloader — masks first-load latency, runs once per session. */}
      <Preloader />

      {/* Pull the SoundCloud Widget API in parallel with hydration so the
          radio component finds it already loaded when its useEffect runs.
          Hidden with the radio for now.
      <Script
        src="https://w.soundcloud.com/player/api.js"
        strategy="afterInteractive"
      />
      */}

      {/* 01 — This week (Installations) */}
      <Suspense fallback={null}>
        <ThisWeek />
      </Suspense>

      {/* 02 — Shop */}
      <Suspense fallback={null}>
        <ShopSection />
      </Suspense>

      {/* 03 — Editorial (campaigns) + Radio — hidden from the home page for now.
      <Suspense fallback={null}>
        <Dispatch />
      </Suspense>
      */}

      <Footer />
    </>
  );
}
