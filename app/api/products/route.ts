import { getCountry } from "lib/localization";
import { getProducts } from "lib/shopify";
import { NextResponse } from "next/server";

// Priced for the visitor's country (cookie or geo-IP), so search shows the
// same currency and amounts as the rest of the site.
export async function GET() {
  try {
    const products = await getProducts({ country: await getCountry() });
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
