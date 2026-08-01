import { getEditorials, getInstallations, getProducts } from "lib/shopify";
import { NavbarContainer } from "./navbar-container";
import { NavbarContent } from "./navbar-content";

// Item counts shown beside the three mobile-menu links (Shop / Installations /
// Editorial). Each source is cached, and any failure just drops that count
// rather than breaking the nav.
async function count(
  fn: () => Promise<{ length: number }>,
): Promise<number | null> {
  try {
    return (await fn()).length;
  } catch {
    return null;
  }
}

export async function Navbar() {
  const counts = await Promise.all([
    count(() => getProducts({})),
    count(getInstallations),
    count(getEditorials),
  ]);

  return (
    <NavbarContainer>
      <NavbarContent counts={counts} />
    </NavbarContainer>
  );
}
