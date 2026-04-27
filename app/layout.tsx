import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { getCart } from "lib/shopify";
import { baseUrl } from "lib/utils";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const vremena = localFont({
  src: "../fonts/vremenagroteskbook.otf",
  variable: "--font-vremena",
});

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = getCart();

  return (
    <html lang="en" className={vremena.variable}>
      <head>
        {/* Warm DNS+TLS for the SoundCloud radio iframe + widget API so the
            handshake doesn't block first-paint of the radio section. */}
        <link rel="preconnect" href="https://w.soundcloud.com" />
        <link rel="preconnect" href="https://api.soundcloud.com" />
        <link rel="dns-prefetch" href="https://i1.sndcdn.com" />
      </head>
      <body className="bg-white text-black selection:bg-pink-500 dark:bg-white dark:text-black dark:selection:bg-teal-300 dark:selection:text-black">
        <CartProvider cartPromise={cart}>
          <Navbar />
          <main>
            {children}
            <Toaster closeButton />
          </main>
        </CartProvider>
      </body>
    </html>
  );
}