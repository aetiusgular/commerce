import { CartView } from "components/cart/cart-view";
import Footer from "components/layout/footer";

export const metadata = {
  title: "Cart",
  description: "Your AGMNT cart.",
};

export default function CartPage() {
  return (
    <div className="agmnt-cart flex min-h-screen flex-col">
      <div className="flex-1">
        <CartView />
      </div>
      <Footer />
    </div>
  );
}
