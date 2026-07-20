import Footer from "components/layout/footer";
import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="agmnt-shop min-h-screen">
      <Suspense fallback={null}>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Suspense>
      <Footer />
    </div>
  );
}
