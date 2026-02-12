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

    const attemptPlay = () => {
      setIsLoaded(true);
      video.play().catch((err) => {
        console.error("Play failed:", err);
      });
    };

    // Multiple event listeners to catch different mobile behaviors
    video.addEventListener("loadedmetadata", attemptPlay);
    video.addEventListener("canplay", attemptPlay);
    video.addEventListener("canplaythrough", attemptPlay);

    // Force load
    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", attemptPlay);
      video.removeEventListener("canplay", attemptPlay);
      video.removeEventListener("canplaythrough", attemptPlay);
    };
  }, [videoUrl]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
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