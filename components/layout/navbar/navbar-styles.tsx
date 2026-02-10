"use client";

import { usePathname } from "next/navigation";

export function useNavbarStyles() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return {
    mobile: isHome 
      ? "grid grid-cols-2 w-full h-max text-black text-xl font-vremena tracking-tight px-2 md:hidden bg-transparent border-0"
      : "grid grid-cols-2 w-full h-max text-black text-xl font-vremena tracking-tight px-2 md:hidden bg-white border-[0.25px] border-black",
    desktop: isHome
      ? "hidden md:grid grid-cols-3 w-full h-max text-black font-vremena tracking-tight py-0.5 px-6 [&>a]:text-sm [&>button]:text-sm bg-transparent border-b-0"
      : "hidden md:grid grid-cols-3 w-full h-max text-black font-vremena tracking-tight py-0.5 px-6 [&>a]:text-sm [&>button]:text-sm bg-white border-b-[0.25px] border-black/10"
  };
}