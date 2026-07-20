// Renders the hero video element raw and trusts the browser's native handling
// for everything: load, decode, autoplay, first-frame display. Mirrors Aino's
// attribute set 1:1 — width/height (intrinsic media size, factors into iOS
// autoplay heuristic) and crossorigin="anonymous" (Supabase returns
// Access-Control-Allow-Origin: * so this is safe and matches Aino's pattern).
//
// The parent <section> already provides bg-black, so the brief moment before
// the first frame decodes shows black naturally — no separate wrapper needed.
export default function VideoBackground({ videoUrl }: { videoUrl: string }) {
  return (
    <video
      className="absolute inset-0 w-full h-full object-cover"
      src={videoUrl}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      width={1080}
      height={1080}
      crossOrigin="anonymous"
    />
  );
}
