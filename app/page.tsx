import VideoBackground from "components/home/video-background";
import Footer from "components/layout/footer";
import { getShopMetafield } from "lib/shopify";

export default async function Page() {
  const videoUrl = await getShopMetafield("custom", "homepage_video");

  return (
    <main className="flex flex-col w-full">
      <div className="relative w-full h-screen overflow-hidden bg-black">
        {videoUrl && <VideoBackground videoUrl={videoUrl} />}
      </div>
      <Footer />
    </main>
  );
}