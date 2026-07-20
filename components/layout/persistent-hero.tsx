"use client";

import { HeroOverlay } from "components/home/hero-overlay";
import VideoBackground from "components/home/video-background";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Mounts the home hero (video + overlay) ONCE — at the layout level — and
// keeps it in the DOM across all routes. On non-home routes it's hidden via
// display:none rather than unmounted, so when the user returns to home the
// <video> is already decoded and playing — no reload, no first-frame flash.
//
// The element is only created the first time the user visits home in this
// session: a user landing directly on /shop and never visiting / will not pay
// the cost of fetching/buffering the hero video.
export function PersistentHero({ videoUrl }: { videoUrl: string | null }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  // Sticky mount: once the user reaches home the hero stays in the DOM forever
  // (just toggled visible/hidden) so subsequent returns are instant. The OR
  // derivation makes the mount happen in the SAME render that flips isHome
  // true — without it, useEffect would run a tick later and the user would
  // briefly see the page without the hero (landing at the shop section
  // because Next.js's scroll-to-top fires during the no-hero gap).
  const [hasBeenHome, setHasBeenHome] = useState(isHome);
  const shouldMount = hasBeenHome || isHome;

  useEffect(() => {
    if (isHome && !hasBeenHome) setHasBeenHome(true);
  }, [isHome, hasBeenHome]);

  // When isHome flips false→true, the hero's display: none → block adds
  // ~100vh at the top of the document. Browsers' scroll-anchoring kicks in
  // and shifts the scroll position down to keep what was previously visible
  // (the shop section) on screen — leaving the user past the hero. Force a
  // scroll-to-top in that exact transition to override the anchoring.
  const prevIsHomeRef = useRef(isHome);
  useEffect(() => {
    if (isHome && !prevIsHomeRef.current) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
    prevIsHomeRef.current = isHome;
  }, [isHome]);

  // iOS Low Power Mode hard-blocks <video autoplay>. The widely-used workaround
  // (used by Aino: see src/pages/home.js around their gridNode mousedown
  // handler) is to call video.play() from inside a user-gesture event handler
  // — iOS allows that even with Low Power Mode on. We listen for the first
  // touch/click/keydown anywhere on the document and trigger play(). On a
  // normal device autoplay already works and this is a harmless no-op; on
  // Low Power Mode the video starts the moment the user interacts with the
  // page, which usually happens within a second or two.
  useEffect(() => {
    if (!shouldMount) return;

    const tryPlay = () => {
      const video = document.querySelector<HTMLVideoElement>("#campaign video");
      if (!video) return;
      video.play().then(() => {
        cleanup();
      }).catch(() => {
        // play() rejected; keep listening so the next gesture retries.
      });
    };

    const events = ["touchstart", "pointerdown", "click", "keydown"] as const;
    for (const ev of events) {
      document.addEventListener(ev, tryPlay, { passive: true });
    }

    const cleanup = () => {
      for (const ev of events) {
        document.removeEventListener(ev, tryPlay);
      }
    };
    return cleanup;
  }, [shouldMount]);

  if (!videoUrl || !shouldMount) return null;

  return (
    <section
      id="campaign"
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ display: isHome ? "block" : "none" }}
      aria-hidden={!isHome}
    >
      <VideoBackground videoUrl={videoUrl} />
      <HeroOverlay />
    </section>
  );
}
