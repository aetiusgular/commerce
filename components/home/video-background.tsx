"use client";

import { useEffect, useRef } from "react";

export default function VideoBackground({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error);
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Optional: Add gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />
    </div>
  );
}