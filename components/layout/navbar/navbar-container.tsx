"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavbarContainer({ children }: { children: ReactNode }) {
  // Sticky on every route (matches the v6 `.chrome`). The home page no longer
  // has the full-bleed video hero, so a fixed nav would overlap section 01.
  return <div className="sticky top-0 z-50">{children}</div>;
}

export function useIsHome() {
  const pathname = usePathname();
  return pathname === "/";
}
