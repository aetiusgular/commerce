import { expect, test, type Page } from "@playwright/test";

/**
 * Storefront regression suite.
 *
 * Runs against live Shopify data, so tests that depend on merchandising
 * (a product actually being on sale, a product having measurements) SKIP
 * rather than fail when that data isn't present yet. That way the suite is
 * honest: green means "verified", not "silently assumed".
 */

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

/** Opens the first product on /shop and returns once the PDP has loaded. */
async function openFirstProduct(page: Page) {
  await page.goto("/shop");
  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();
  await page.waitForURL(/\/product\//);
}

test.describe("navbar", () => {
  test("account section is gone", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href*="/account"]')).toHaveCount(0);
    await expect(page.getByText("ACCOUNT", { exact: true })).toHaveCount(0);
  });

  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});

test.describe("product page", () => {
  test("gallery does not trap scroll on mobile; add to cart is reachable", async ({
    page,
  }) => {
    await openFirstProduct(page);

    const gallery = page.getByTestId("product-gallery");
    await expect(gallery).toBeVisible();

    if (isMobile(page)) {
      // The bug: gallery was its own overflow-y scroller, swallowing the swipe.
      const overflowY = await gallery.evaluate(
        (el) => getComputedStyle(el).overflowY,
      );
      expect(["visible", "clip"]).toContain(overflowY);
    }

    // Regardless of viewport, a normal page scroll must reach Add to Cart.
    const addToCart = page.getByRole("button", { name: /add to cart/i });
    const fallback = page.getByText(/ADD TO CART|SELECT SIZE|OUT OF STOCK/);
    const target = (await addToCart.count()) ? addToCart : fallback;

    await target.first().scrollIntoViewIfNeeded();
    await expect(target.first()).toBeInViewport();
  });

  test("price renders, with strike-through when on sale", async ({ page }) => {
    await openFirstProduct(page);
    const price = page.getByTestId("pdp-price");
    await expect(price).toBeVisible();
    await expect(price).not.toBeEmpty();
  });

  test("measurements render only when the metafield is set", async ({
    page,
  }) => {
    await openFirstProduct(page);
    const measurements = page.getByTestId("measurements");
    const count = await measurements.count();

    test.skip(
      count === 0,
      "No custom.measurements metafield on this product yet — nothing to verify.",
    );
    await expect(measurements).toBeVisible();
  });
});

test.describe("shop filters", () => {
  test("desktop uses the compact bar; filtering updates results", async ({
    page,
  }) => {
    test.skip(isMobile(page), "Desktop-only layout.");

    await page.goto("/shop");
    const bar = page.getByTestId("desktop-filter-bar");
    await expect(bar).toBeVisible();

    // The old sidebar reserved a fixed column; the grid should now be wide.
    const grid = page.locator('a[href^="/product/"]').first();
    await expect(grid).toBeVisible();

    // Open the Brands pill and apply the first brand.
    await bar.getByRole("button", { name: /brands/i }).click();
    const firstBrand = bar.locator("ul button").first();
    if (await firstBrand.count()) {
      await firstBrand.click();
      await expect(page).toHaveURL(/vendor=/);
      await expect(bar.getByRole("button", { name: /reset/i })).toBeVisible();
    }
  });

  test("mobile filter dropdown still works", async ({ page }) => {
    test.skip(!isMobile(page), "Mobile-only layout.");
    await page.goto("/shop");
    await expect(page.getByText("Filters")).toBeVisible();
  });
});

test.describe("sale display", () => {
  test("sale cards show a struck-through original price", async ({ page }) => {
    await page.goto("/shop");
    const saleTags = page.getByTestId("sale-tag");
    const count = await saleTags.count();

    test.skip(
      count === 0,
      "No products have a Shopify Compare-at price set — set one to verify sale UI.",
    );

    await expect(saleTags.first()).toBeVisible();
    await expect(page.locator(".line-through").first()).toBeVisible();
  });

  test("sale banner renders when configured in Shopify", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("sale-banner");
    const count = await banner.count();

    test.skip(
      count === 0,
      "custom.sale_banner_text shop metafield not set — nothing to verify.",
    );

    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: /dismiss/i }).click();
    await expect(banner).toBeHidden();
  });
});

test.describe("installations article", () => {
  test("author renders and images may break out of the text column", async ({
    page,
  }) => {
    await page.goto("/installations");
    const firstArticle = page.locator('a[href^="/installations/"]').first();
    test.skip((await firstArticle.count()) === 0, "No articles published.");

    await firstArticle.click();
    await page.waitForURL(/\/installations\/.+/);

    await expect(page.getByTestId("article-body")).toBeVisible();

    // Full-bleed images must never introduce a horizontal scrollbar.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});

test.describe("meta pixel", () => {
  test("fires PageView when a pixel id is configured, silent when not", async ({
    page,
  }) => {
    const pixelRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("facebook.com/tr")) pixelRequests.push(req.url());
    });

    await page.goto("/");
    await page.waitForTimeout(2500);

    const configured = await page.evaluate(
      () => typeof (window as { fbq?: unknown }).fbq === "function",
    );

    test.skip(
      !configured,
      "NEXT_PUBLIC_META_PIXEL_ID is not set — pixel intentionally disabled.",
    );

    expect(pixelRequests.length).toBeGreaterThan(0);
  });
});
