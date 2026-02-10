import Footer from "components/layout/footer";
import { getShopMetafield } from "lib/shopify";

export default async function Page() {
  // Fetch the homepage video URL from Shopify metafield
  const videoUrl = await getShopMetafield("custom", "homepage_video");

  // Debug - log what we're getting
  console.log("Video URL from Shopify:", videoUrl);

  // Fallback video - make sure path is correct
  const videoSrc = videoUrl || "/testmedia/home.mov";

  return (
    <main className="flex flex-col w-full">
      {/* Full-screen video section */}
      <div className="relative w-full h-screen overflow-hidden">
        {videoSrc ? (
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
            <p>Video not found</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}