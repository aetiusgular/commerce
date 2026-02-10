import Footer from "components/layout/footer";
import Collections from "components/layout/search/collections";
import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pb-4 text-black md:flex-row pt-8">
        <div className="order-first w-full flex-none md:max-w-[200px] ">
          <Collections />
        </div>
        <div className="order-last min-h-screen w-full md:order-none">
          <Suspense fallback={null}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}