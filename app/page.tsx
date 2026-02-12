import VideoBackground from "components/home/video-background";
import Footer from "components/layout/footer";

export default async function Page() {
  // TEMP: hardcode to test
  const videoUrl = "https://download-video-ak.vimeocdn.com/v3-1/playback/0b207b32-7661-4096-b510-3cf34ec1bd73/a0a03ac2-61bff28f?__token__=st=1770854180~exp=1770857780~acl=%2Fv3-1%2Fplayback%2F0b207b32-7661-4096-b510-3cf34ec1bd73%2Fa0a03ac2-61bff28f%2A~hmac=0ea2d51470af763de20314a8e80b8c1b14b278dc80a9bd6d81c21b5107c5f501&r=dXMtZWFzdDE%3D";

  return (
    <main className="flex flex-col w-full">
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <VideoBackground videoUrl={videoUrl} />
      </div>
      <Footer />
    </main>
  );
}