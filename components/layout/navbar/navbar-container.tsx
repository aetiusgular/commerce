"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavbarContainer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className={isHome ? "fixed top-0 left-0 w-full z-50" : "sticky top-0 z-50"}>
      {children}
    </div>
  );
}

export function useIsHome() {
  const pathname = usePathname();
  return pathname === "/";
}