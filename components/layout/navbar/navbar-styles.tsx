"use client";

import { usePathname } from "next/navigation";

export function useNavbarStyles() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return {
    mobile: isHome
      ? "grid grid-cols-2 w-full h-max text-black text-xl font-vremena tracking-tight px-2 lg:hidden bg-white/55 backdrop-blur-[18px] backdrop-saturate-150 supports-[backdrop-filter]:bg-white/55 border-b border-black/10"
      : "grid grid-cols-2 w-full h-max text-black text-xl font-vremena tracking-tight px-2 lg:hidden bg-white border-[0.25px] border-black",
    desktop: isHome
      ? "hidden lg:grid grid-cols-3 w-full h-max text-black font-vremena tracking-tight py-0.5 px-6 [&>a]:text-sm [&>button]:text-sm bg-white/55 backdrop-blur-[18px] backdrop-saturate-150 supports-[backdrop-filter]:bg-white/55 border-b border-black/10"
      : "hidden lg:grid grid-cols-3 w-full h-max text-black font-vremena tracking-tight py-0.5 px-6 [&>a]:text-sm [&>button]:text-sm bg-white border-b-[0.25px] border-black/10",
  };
}