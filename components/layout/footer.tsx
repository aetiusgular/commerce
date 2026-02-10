import { getMenu } from "lib/shopify";
import Image from "next/image";
import Link from "next/link";
import { LiveClock } from "../common/clock";
import FooterMenu from "./footer-menu";
import { Registration } from "./newsletter";

const { SITE_NAME } = process.env;

export default async function Footer() {
  const menu = await getMenu("next-js-frontend-footer-menu");

  return (
    <footer className="w-full min-h-[25vh] border-black/40 border-t-[0.25px] py-16 font-vremena tracking-[-0.03em]">
      <div className="max-w-8xl mx-auto lg:px-8 md:px-16 sm:px-24 px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Section 1 - Logo, Location, Contact */}
          <div className="lg:col-span-1 space-y-4">
            <Image
              src="/images/AGMNT-logo-black.png"
              alt="AGMNT wordmark in black."
              width={104}
              height={52}
              className="-mt-8 -ml-2.25"
            />
            <ul className="space-y-2 text-sm">
              <li>
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-row justify-between">
                    <a
                      href="#"
                      className="block hover:text-black transition-colors"
                    >
                      California
                    </a>
                    <LiveClock locale="America/Los_Angeles" />
                  </div>
                  <div className="flex flex-row justify-between">
                    <div />
                    <Link
                      href="mailto:info@agmnt.space"
                      className="hover:underline"
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Section 2 - Footer Menu (Privacy, Shipping, Terms) */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xl text-white mb-2">_____</h3>
            <FooterMenu menu={menu} />
          </div>

          {/* Section 3 - Social Links */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xl text-white mb-2">_____</h3>
            <ul className="space-y-1 text-sm [&>li>a]:underline [&>li>a]:underline-offset-2 [&>li>a]:decoration-black/40 [&>li:hover>a]:decoration-black">
              <li>
                <a
                  href="https://www.instagram.com/agmntstore/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-black transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@agmnt_store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-black transition-colors"
                >
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@agmnt_store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-black transition-colors"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>

          {/* Section 4 - Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xl text-white mb-2">_____</h3>
              <h3 className="text-sm text-black mb-2">Newsletter</h3>
              <Registration />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}