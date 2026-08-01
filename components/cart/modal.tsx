"use client";

import { Dialog, Transition } from "@headlessui/react";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import type { CartItem } from "lib/shopify/types";
import { createUrl, productPath } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCartAndSetCookie, redirectToCheckout } from "./actions";
import { useCart } from "./cart-context";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal({
  isMobile = false,
}: {
  isMobile?: boolean;
}) {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    if (
      cart?.totalQuantity &&
      cart?.totalQuantity !== quantityRef.current &&
      cart?.totalQuantity > 0
    ) {
      if (!isOpen) {
        setIsOpen(true);
      }
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isOpen, cart?.totalQuantity, quantityRef]);

  // Mobile Icon Button
  if (isMobile) {
    return (
      <>
        <button
          aria-label="Open cart"
          onClick={openCart}
          className="relative flex items-center justify-center"
        >
          <ShoppingBagIcon className="h-8 w-8" />
          {cart?.totalQuantity ? (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
              {cart.totalQuantity}
            </div>
          ) : null}
        </button>
        <CartModalContent
          isOpen={isOpen}
          closeCart={closeCart}
          cart={cart}
          updateCartItem={updateCartItem}
        />
      </>
    );
  }

  // Desktop Text Button
  return (
    <>
      <button
        aria-label="Open cart"
        onClick={openCart}
        className="whitespace-nowrap transition-opacity hover:opacity-60"
      >
        CART ({cart?.totalQuantity || 0})
      </button>
      <CartModalContent
        isOpen={isOpen}
        closeCart={closeCart}
        cart={cart}
        updateCartItem={updateCartItem}
      />
    </>
  );
}

// Extract modal content to separate component
function CartModalContent({
  isOpen,
  closeCart,
  cart,
  updateCartItem,
}: {
  isOpen: boolean;
  closeCart: () => void;
  cart: any;
  updateCartItem: any;
}) {
  return (
    <Transition show={isOpen}>
      <Dialog onClose={closeCart} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-in-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <Dialog.Panel className="font-vremena fixed top-0 right-0 bottom-0 flex h-full w-full flex-col border-l border-black/10 bg-white text-black md:w-[400px]">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <p className="text-xs font-medium tracking-[0.16em] uppercase">
                Cart ({cart?.totalQuantity || 0})
              </p>
              <button
                aria-label="Close cart"
                onClick={closeCart}
                className="text-xs tracking-[0.12em] text-black/50 uppercase transition-colors hover:text-black"
              >
                Close ✕
              </button>
            </div>

            {!cart || cart.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="text-xs tracking-[0.16em] text-black/50 uppercase">
                  Your cart is empty
                </p>
                <button
                  onClick={closeCart}
                  className="mt-4 text-xs tracking-[0.12em] uppercase underline underline-offset-4"
                >
                  Continue shopping →
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between overflow-hidden">
                <ul className="grow overflow-auto px-6">
                  {cart.lines
                    .sort((a: CartItem, b: CartItem) =>
                      a.merchandise.product.title.localeCompare(
                        b.merchandise.product.title,
                      ),
                    )
                    .map((item: CartItem, i: number) => {
                      const merchandiseSearchParams =
                        {} as MerchandiseSearchParams;

                      item.merchandise.selectedOptions.forEach(
                        ({ name, value }) => {
                          if (value !== DEFAULT_OPTION) {
                            merchandiseSearchParams[name.toLowerCase()] = value;
                          }
                        },
                      );

                      const merchandiseUrl = createUrl(
                        productPath(item.merchandise.product),
                        new URLSearchParams(merchandiseSearchParams),
                      );

                      return (
                        <li
                          key={i}
                          className="flex w-full flex-col border-b border-black/10"
                        >
                          <div className="relative flex w-full flex-row justify-between py-5">
                            <div className="absolute z-40 -mt-1 -ml-1">
                              <DeleteItemButton
                                item={item}
                                optimisticUpdate={updateCartItem}
                              />
                            </div>
                            <div className="flex flex-row">
                              <div className="relative h-20 w-16 overflow-hidden border border-black/10 bg-neutral-100">
                                <Image
                                  className="h-full w-full object-cover"
                                  width={64}
                                  height={80}
                                  alt={
                                    item.merchandise.product.featuredImage
                                      .altText || item.merchandise.product.title
                                  }
                                  src={
                                    item.merchandise.product.featuredImage.url
                                  }
                                />
                              </div>
                              <Link
                                href={merchandiseUrl}
                                onClick={closeCart}
                                className="z-30 ml-3 flex flex-row"
                              >
                                <div className="flex flex-1 flex-col">
                                  <span className="text-sm leading-tight tracking-[-0.02em]">
                                    {item.merchandise.product.title}
                                  </span>
                                  {item.merchandise.title !== DEFAULT_OPTION ? (
                                    <p className="mt-1 text-xs text-black/50 uppercase">
                                      {item.merchandise.title}
                                    </p>
                                  ) : null}
                                </div>
                              </Link>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <Price
                                className="text-right text-sm"
                                amount={item.cost.totalAmount.amount}
                                currencyCode={
                                  item.cost.totalAmount.currencyCode
                                }
                              />
                              <div className="flex h-8 flex-row items-center border border-black/20">
                                <EditItemQuantityButton
                                  item={item}
                                  type="minus"
                                  optimisticUpdate={updateCartItem}
                                />
                                <p className="w-7 text-center text-sm">
                                  {item.quantity}
                                </p>
                                <EditItemQuantityButton
                                  item={item}
                                  type="plus"
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
                <div className="border-t border-black/10 px-6 py-5 text-xs tracking-[0.02em] text-black/60 uppercase">
                  <div className="mb-2 flex items-center justify-between">
                    <p>Taxes</p>
                    <Price
                      className="text-right text-black normal-case"
                      amount={cart.cost.totalTaxAmount.amount}
                      currencyCode={cart.cost.totalTaxAmount.currencyCode}
                    />
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <p>Shipping</p>
                    <p className="text-right normal-case">
                      Calculated at checkout
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/10 pt-3 text-black">
                    <p>Total</p>
                    <Price
                      className="text-right text-sm text-black normal-case"
                      amount={cart.cost.totalAmount.amount}
                      currencyCode={cart.cost.totalAmount.currencyCode}
                    />
                  </div>
                  <form action={redirectToCheckout} className="mt-5">
                    <CheckoutButton />
                  </form>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="block w-full bg-black py-4 text-center text-xs font-semibold tracking-[0.16em] text-white uppercase transition-opacity hover:opacity-80"
      type="submit"
      disabled={pending}
    >
      {pending ? <LoadingDots className="bg-white" /> : "Checkout"}
    </button>
  );
}
