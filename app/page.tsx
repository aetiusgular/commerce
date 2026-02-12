import VideoBackground from "components/home/video-background";
import Footer from "components/layout/footer";
import { getShopMetafield } from "lib/shopify";

export default async function Page() {
  const videoUrl = await getShopMetafield("custom", "homepage_video");

  // Fallback if metafield not set
  if (!videoUrl) {
    console.error("No video URL found in metafield");
  }

  return (
    <main className="flex flex-col w-full">
      <div className="relative w-full h-screen overflow-hidden bg-black">
        {videoUrl ? (
          <VideoBackground videoUrl={videoUrl} />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
      </div>
      <Footer />
    </main>
  );
}