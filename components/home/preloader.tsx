"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const HOLD_MS = 1200;
const FADE_MS = 600;
// sessionStorage scope: same tab/window. Closing the tab or opening a new one
// resets it — i.e. the preloader runs once per browser session, not once per
// route change back to home.
const STORAGE_KEY = "agmnt_preloader_seen";

// Full-screen brand moment shown on the user's first home-page visit per
// session. Holds for HOLD_MS to give the hero video + SoundCloud iframe time
// to buffer in the background, then fades out over FADE_MS. Subsequent
// navigations back to home in the same tab skip it entirely.
export function Preloader() {
  const [phase, setPhase] = useState<"showing" | "hiding" | "done">("showing");

  useEffect(() => {
    // Repeat mount in the same session (route change, in-tab refresh): skip.
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setPhase("done");
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const hideTimer = setTimeout(() => setPhase("hiding"), HOLD_MS);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = prevOverflow;
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden={phase === "hiding"}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white ease-out ${
        phase === "hiding" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ transitionProperty: "opacity", transitionDuration: `${FADE_MS}ms` }}
    >
      <Image
        src="/images/AGMNT-logo-black.png"
        alt=""
        width={240}
        height={120}
        priority
        className="w-32 sm:w-40 lg:w-48 h-auto"
      />
    </div>
  );
}
