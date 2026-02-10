import Footer from "components/layout/footer";
import { getShopMetafield } from "lib/shopify";

export default async function Page() {
  // Fetch the homepage video URL from Shopify metafield
  const videoUrl = await getShopMetafield("custom", "homepage_video");

  // Fallback video if metafield is not set
  const videoSrc = videoUrl || "/testmedia/home.mov";

  return (
    <main className="flex flex-col w-full">
      {/* Full-screen video section */}
      <div className="relative w-full h-screen overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
      <Footer />
    </main>
  );
}