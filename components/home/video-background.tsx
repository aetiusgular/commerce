"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoBackground({ videoUrl }: { videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // DEBUG
    console.log("=== VideoBackground ===");
    console.log("Video URL received:", videoUrl);
    console.log("======================");

    const handleCanPlay = () => {
      console.log("Video can play!");
      setIsLoading(false);
      video.play().catch((err) => {
        console.error("Autoplay failed:", err);
        setError("Autoplay failed: " + err.message);
      });
    };

    const handleError = (e: Event) => {
      const videoEl = e.target as HTMLVideoElement;
      const errorCode = videoEl.error?.code;
      const errorMsg = videoEl.error?.message;
      console.error("Video error:", errorCode, errorMsg);
      setError(`Video error: ${errorCode} - ${errorMsg}`);
      setIsLoading(false);
    };

    const handleLoadStart = () => console.log("Video load started...");
    const handleLoadedData = () => console.log("Video data loaded!");
    const handleStalled = () => console.log("Video stalled!");
    const handleWaiting = () => console.log("Video waiting...");

    if (video.readyState >= 3) {
      handleCanPlay();
    }

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("waiting", handleWaiting);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("stalled", handleStalled);
      video.removeEventListener("waiting", handleWaiting);
    };
  }, [videoUrl]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Loading state */}
      {isLoading && !error && (
        <div className="absolute inset-0 bg-black z-10" />
      )}

      {/* Error state - visible for debugging */}
      {error && (
        <div className="absolute inset-0 bg-black z-10 flex items-center justify-center p-8">
          <div className="text-white text-center">
            <p className="text-red-400 text-sm font-mono break-all">{error}</p>
            <p className="text-white/60 text-xs mt-2 break-all">URL: {videoUrl}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}