"use client";

import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex items-center justify-center"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeMobileMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 right-0 top-0 flex h-full w-full flex-col bg-white pb-6">
              <div className="p-4">
                <button
                  className="mb-4 flex items-center justify-center"
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <ul className="flex w-full flex-col">
                  <li className="py-2 text-xl text-black transition-colors hover:opacity-60">
                    <Link
                      href="/shop"
                      prefetch={true}
                      onClick={closeMobileMenu}
                    >
                      SHOP
                    </Link>
                  </li>
                  <li className="py-2 text-xl text-black transition-colors hover:opacity-60">
                    <Link
                      href="/installations"
                      prefetch={true}
                      onClick={closeMobileMenu}
                    >
                      INSTALLATIONS
                    </Link>
                  </li>
                  <li className="py-2 text-xl text-black transition-colors hover:opacity-60">
                    <Link
                      href="/editorial"
                      prefetch={true}
                      onClick={closeMobileMenu}
                    >
                      EDITORIAL
                    </Link>
                  </li>
                  {menu.map((item: Menu) => (
                    <li
                      className="py-2 text-xl text-black transition-colors hover:opacity-60"
                      key={item.title}
                    >
                      <Link
                        href={item.path}
                        prefetch={true}
                        onClick={closeMobileMenu}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
