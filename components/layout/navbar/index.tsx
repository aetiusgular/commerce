import { getMenu } from "lib/shopify";
import { NavbarContainer } from "./navbar-container";
import { NavbarContent } from "./navbar-content";

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = await getMenu("next-js-frontend-header-menu");

  return (
    <NavbarContainer>
      <NavbarContent menu={menu} />
    </NavbarContainer>
  );
}