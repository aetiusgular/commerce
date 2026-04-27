"use client";

import { HeroOverlay } from "components/home/hero-overlay";
import VideoBackground from "components/home/video-background";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [hasMountedHero, setHasMountedHero] = useState(isHome);

  useEffect(() => {
    if (isHome && !hasMountedHero) setHasMountedHero(true);
  }, [isHome, hasMountedHero]);

  if (!videoUrl || !hasMountedHero) return null;

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
