"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoBackground({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force these attributes programmatically for mobile
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    // `playing` fires AFTER the first frame is actually painted on screen.
    // Using `canplay` (which only means "enough buffered to start") would
    // reveal the <video> a few ms before any frame is rendered, leaking the
    // parent's black background through and producing the perceived flash.
    const reveal = () => setIsLoaded(true);

    video.play().catch(() => {
      // Autoplay rejection is expected on some mobile browsers; user gesture
      // or visibility change will trigger it later.
    });

    if (!video.paused && video.readyState >= 3) {
      reveal();
    } else {
      video.addEventListener("playing", reveal, { once: true });
    }

    return () => {
      video.removeEventListener("playing", reveal);
    };
  }, [videoUrl]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <video
        ref={videoRef}
        // No opacity transition: a 0→100 fade reads as a flash because the
        // black parent shows through during the in-between values. Hard
        // visibility toggle means the video appears in the same frame the
        // browser has just painted.
        className={`w-full h-full object-cover ${
          isLoaded ? "visible" : "invisible"
        }`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        x-webkit-airplay="deny"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}